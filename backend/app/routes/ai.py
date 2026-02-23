from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv
from groq import Groq
from openai import OpenAI


# Load .env explicitly
import pathlib
base_dir = pathlib.Path(__file__).parent.parent.parent
env_path = base_dir / ".env"
load_dotenv(dotenv_path=env_path)
print(f"[DEBUG] Loading .env from {env_path}, exists: {env_path.exists()}", flush=True)



router = APIRouter()


def get_groq_client() -> Optional[Groq]:
    """Return a Groq client if GROQ_API_KEY is set, otherwise None."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("[DEBUG] GROQ_API_KEY is missing", flush=True)
        return None
    print(f"[DEBUG] GROQ_API_KEY found: {api_key[:4]}...", flush=True)
    try:
        return Groq(api_key=api_key)
    except Exception as e:
        print(f"[AI] Error creating Groq client: {e}")
        return None


def get_openai_client() -> Optional[OpenAI]:
    """Return an OpenAI client if OPENAI_API_KEY is set, otherwise None."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("[DEBUG] OPENAI_API_KEY is missing", flush=True)
        return None
    print(f"[DEBUG] OPENAI_API_KEY found: {api_key[:4]}...", flush=True)
    try:
        return OpenAI(api_key=api_key)
    except Exception as e:
        print(f"[AI] Error creating OpenAI client: {e}")
        return None


# Request/Response models
class GenerateBlogRequest(BaseModel):
    topic: str
    length: Optional[str] = "medium"
    language: Optional[str] = "English"
    user_id: Optional[int] = None

class GenerateImageRequest(BaseModel):
    prompt: str

class SummarizeRequest(BaseModel):
    content: str

class ImageAnalysisRequest(BaseModel):
    image_base64: str

class HeadlineRequest(BaseModel):
    content: str

class ToneChangeRequest(BaseModel):
    content: str
    tone: str  # e.g., "professional", "casual", "friendly", "formal"

class PlagiarismCheckRequest(BaseModel):
    content: str


def extract_image_keyword(text):
    """Extract a single visual keyword from text using AI."""
    groq_client = get_groq_client()
    openai_client = get_openai_client()
    
    try:
        print(f"[AI] Extracting keyword for: {text}", flush=True)
        # Simple heuristic: if short (<= 2 words), use as is
        if len(text.split()) <= 2:
            return text
            
        # Use Groq or OpenAI to extract
        client = groq_client if groq_client else openai_client
        if not client:
            return text
        
        model = "llama-3.1-8b-instant" if groq_client else "gpt-3.5-turbo"
        
        resp = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a keyword extractor. Output ONLY a single visual keyword (noun) that best represents the topic for an image search. Example: 'Artificial Intelligence' -> 'Technology'. 'Healthy Cooking' -> 'Food'."},
                {"role": "user", "content": text}
            ],
            max_tokens=10,
            temperature=0.3
        )
        keyword = resp.choices[0].message.content.strip().split()[0]
        # Remove non-alphanumeric just in case
        import re
        keyword = re.sub(r'[^a-zA-Z0-9]', '', keyword)
        print(f"[AI] Extracted keyword: {keyword}", flush=True)
        return keyword
    except Exception as e:
        print(f"[AI] Keyword extraction failed: {e}", flush=True)
        return text.split()[0] if text else "technology"

def log_ai_usage(tool_name: str, success: bool = True):
    from ..database import SessionLocal
    from .. import models
    from datetime import datetime
    
    db = SessionLocal()
    try:
        usage = models.AIUsage(
            tool_used=tool_name,
            timestamp=datetime.now().isoformat(),
            success=1 if success else 0
        )
        db.add(usage)
        db.commit()
    except Exception as e:
        print(f"[Error] Failed to log AI usage: {e}")
    finally:
        db.close()


@router.post("/generate-blog")
def generate_blog(request: GenerateBlogRequest):
    """Generate a blog article. Use Groq if available, then OpenAI, otherwise fallback."""
    groq_client = get_groq_client()
    openai_client = get_openai_client()
    topic = request.topic.strip() or "your topic"
    language = request.language or "English"

    length_map_prompts = {
        "short": "300-500 words",
        "medium": "800-1200 words",
        "long": "1500-2000 words",
    }
    word_count = length_map_prompts.get(request.length, "800-1200 words")

    # Log usage
    log_ai_usage("blog_generator")

    # Helper to save blog to DB
    def save_generated_blog(title, content, user_id):
        try:
            from ..database import SessionLocal
            from .. import models
            from datetime import datetime
            
            db = SessionLocal()
            
            author_name = "AI Generated"
            if user_id:
                user = db.query(models.User).filter(models.User.id == user_id).first()
                if user:
                    author_name = user.full_name

            new_blog = models.Blog(
                title=title,
                content=content,
                author=author_name,
                user_id=user_id,
                tags=["AI Generated"],
                created_at=datetime.now().isoformat(),
                updated_at=datetime.now().isoformat()
            )
            db.add(new_blog)
            db.commit()
            db.refresh(new_blog)
            db.close()
            print(f"[AI] Saved generated blog: {title} (ID: {new_blog.id})")
        except Exception as e:
            print(f"[AI] Failed to save generated blog: {e}")

    # Helper function to process content and generate images
    def process_content_images(content, topic):
        import re
        
        # Strip all [IMAGE: ...] tags to ensure clean text output
        # regex to find [IMAGE: description]
        final_content = re.sub(r'\[IMAGE: .*?\]', '', content)
        
        # Also remove potential double newlines caused by removal
        final_content = re.sub(r'\n\s*\n\s*\n', '\n\n', final_content)
                
        return final_content

    # --- Try Groq first ---
    if groq_client:
        try:
            resp = groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            f"You are an expert analyst and subject matter authority. You must write the article in {language}. "
                            "Your goal is to write a deep, insightful article about the TOPIC itself. "
                            "CRITICAL RULE: Do NOT write a tutorial, 'how-to', or guide on 'how to blog' or 'how to use' the topic. "
                            "If the topic is a company (e.g. 'Microsoft', 'Google'), write about its history, business, products, and impact on the world. "
                            "If the topic is 'Microsoft', do NOT write about 'creating a blog on Microsoft'. Write about the tech giant itself. "
                            "Directly address the subject matter with facts, history, social, and economic analysis. "
                            "Use a 'Premium' tone: authoritative, sophisticated, and engaging. "
                            "Structure: Introduction (hook), Key Concepts (deep dive), Real-world Examples, and a Thought-provoking Conclusion. "
                            "Do NOT include the Title at the very top, as it is handled separately. "
                            "Start directly with the introduction."
                        ),
                    },
                    {
                        "role": "user",
                        "content": (
                            f"Write a comprehensive, analytical article about: '{topic}' in {language}. "
                            f"Target length: {word_count}. "
                            "Use markdown with clear headings (##, ###), bullet points, and bold text for emphasis."
                        ),
                    },
                ],
                temperature=0.7,
                max_tokens=2000,
            )
            content = resp.choices[0].message.content
            
            # Process images (Header + Inline)
            final_content = process_content_images(content, topic)
            
            # Save to DB
            save_generated_blog(topic, final_content, request.user_id)

            return {
                "success": True,
                "content": final_content,
                "message": "Blog generated using Groq (llama-3.1-8b-instant) with DALL-E 3 images.",
            }
        except Exception as e:
            print(f"[AI] Groq error in generate_blog: {e}")

    # --- Try OpenAI next ---
    if openai_client:
        try:
            resp = openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an expert analyst and subject matter authority. "
                            "Your goal is to write a deep, insightful article about the TOPIC itself. "
                            "CRITICAL RULE: Do NOT write a tutorial, 'how-to', or guide on 'how to blog' or 'how to use' the topic. "
                            "If the topic is a company (e.g. 'Microsoft', 'Google'), write about its history, business, products, and impact on the world. "
                            "If the topic is 'Microsoft', do NOT write about 'creating a blog on Microsoft'. Write about the tech giant itself. "
                            "Directly address the subject matter with facts, history, social, and economic analysis. "
                            "Use a 'Premium' tone: authoritative, sophisticated, and engaging. "
                            "Do NOT include the Title at the very top."
                        ),
                    },
                    {
                        "role": "user",
                        "content": (
                            f"Write a comprehensive, analytical article about: '{topic}'. "
                            f"Target length: {word_count}. "
                            "Use markdown with clear headings."
                        ),
                    },
                ],
                temperature=0.7,
                max_tokens=2000,
            )
            content = resp.choices[0].message.content
            
            # Process images (Header + Inline)
            final_content = process_content_images(content, topic)

            # Save to DB
            save_generated_blog(topic, final_content, request.user_id)

            return {
                "success": True,
                "content": final_content,
                "message": "Blog generated using OpenAI (gpt-3.5-turbo) with DALL-E 3 images.",
            }
        except Exception as e:
            print(f"[AI] OpenAI error in generate_blog: {e}")


    # --- Fallback: local template ---
    length_map_paragraphs = {
        "short": 3,
        "medium": 5,
        "long": 8,
    }
    paragraphs = length_map_paragraphs.get(request.length, 5)

    intro = (
        f"{topic.capitalize()} has become an important subject in the modern world. "
        "In this article, we will explore the key ideas, why it matters, and how you can start using it in practice."
    )

    body_points = [
        f"First, it is useful to understand the basic definition of {topic}. "
        f"At a high level, it describes a collection of concepts, tools, and practices that help us solve real problems.",
        f"Another important part of {topic} is how it is used in day–to–day life. "
        "Many people interact with it without even noticing, through apps, websites, and the services they rely on.",
        f"When learning about {topic}, it is helpful to start small. "
        "Focus on a few core ideas, try tiny experiments, and build confidence step by step.",
        f"In addition, {topic} is always changing. New techniques, frameworks, and tools appear frequently, "
        "so staying curious and reading a little each week can make a big difference.",
        f"Finally, it is worth remembering that {topic} is not only about technology, but also about people. "
        "Clear communication, responsible usage, and good documentation are just as important as any technical skill.",
    ]

    selected = body_points[: paragraphs - 2] if paragraphs > 2 else body_points[:1]

    conclusion = (
        f"In summary, {topic} is a broad area with many opportunities to learn and create. "
        "By taking time to understand the basics and practising regularly, you can turn ideas into working projects "
        "and stay prepared for future developments."
    )

    # Inject dynamic image fallback
    image_url = f"https://source.unsplash.com/1600x900/?{topic.replace(' ', ',')}"
    content = f"![{topic}]({image_url})\n\n# {topic}\n\n{intro}\n\n" + "\n\n".join(selected) + f"\n\n{conclusion}"

    # Save to DB
    save_generated_blog(topic, content, request.user_id)

    return {
        "success": True,
        "content": content,
        "message": "Blog generated using the built‑in template (AI services not configured or failed).",
    }


@router.post("/summarize")
def summarize_blog(request: SummarizeRequest):
    """Summarize text. Use Groq if available, then OpenAI, otherwise fallback."""
    groq_client = get_groq_client()
    openai_client = get_openai_client()
    text = (request.content or "").strip()
    if not text:
        return {
            "success": True,
            "summary": "No content was provided to summarize.",
            "message": "Summary generated using simple rule‑based logic.",
        }

    system_prompt = "You are a helpful assistant that summarizes text clearly and concisely."
    user_prompt = f"Summarize the following text in 2–3 short paragraphs:\n\n{text}"

    # --- Try Groq first ---
    if groq_client:
        try:
            resp = groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.4,
                max_tokens=500,
            )
            summary = resp.choices[0].message.content
            return {
                "success": True,
                "summary": summary,
                "message": "Summary generated using Groq (llama-3.1-8b-instant).",
            }
        except Exception as e:
            print(f"[AI] Groq error in summarize_blog: {e}")

    # --- Try OpenAI next ---
    if openai_client:
        try:
            resp = openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.4,
                max_tokens=500,
            )
            summary = resp.choices[0].message.content
            return {
                "success": True,
                "summary": summary,
                "message": "Summary generated using OpenAI (gpt-3.5-turbo).",
            }
        except Exception as e:
            print(f"[AI] OpenAI error in summarize_blog: {e}")

    # --- Fallback: simple local summary ---
    # Take the first ~2–3 sentences as a crude “summary”.
    sentences = [s.strip() for s in text.replace("\n", " ").split(".") if s.strip()]
    summary = ". ".join(sentences[:3])
    if len(sentences) > 3:
        summary += "..."

    return {
        "success": True,
        "summary": summary,
        "message": "Summary generated using simple rule‑based logic.",
    }


@router.post("/generate-headline")
def generate_headline(request: HeadlineRequest):
    """Generate headline ideas. Use Groq if available, then OpenAI, otherwise fallback."""
    groq_client = get_groq_client()
    openai_client = get_openai_client()
    base = (request.content or "").strip() or "Your Topic"
    # --- Pre-process: Extract topic if input is long ---
    if len(base) > 100:
        # Use AI to extract the core topic first
        try:
             # Use a cheaper/faster model for extraction if possible, or just the same one
            extract_resp = groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": "Extract the main topic from this text in 5-10 words. Do not explain, just state the topic."},
                    {"role": "user", "content": base},
                ],
                max_tokens=50,
            ) if groq_client else None
            
            if extract_resp:
                base = extract_resp.choices[0].message.content.strip()
        except Exception as e:
            print(f"[AI] Error extracting topic: {e}")
            # Fallback: Just take first 100 chars
            base = base[:100]

    system_prompt = "You are an expert copywriter. Create 5 catchy, high-converting, and SEO-friendly blog titles based on the topic provided."
    user_prompt = f"Topic: {base}\n\nGenerate 5 distinct headlines. Output ONLY the headlines, one per line. Do NOT use quotation marks. Do NOT number them."

    def parse_headlines(text):
        lines = [l.strip(" -•\t\"") for l in text.split("\n") if l.strip()]
        # Remove numbering (1., 2., etc.)
        cleaned = []
        for l in lines:
            if l[0].isdigit() and l[1] in ['.', ')']:
                cleaned.append(l[2:].strip())
            else:
                cleaned.append(l)
        return cleaned[:5]

    # --- Try Groq first ---
    if groq_client:
        try:
            resp = groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.8,
                max_tokens=200,
            )
            headlines = parse_headlines(resp.choices[0].message.content)
            if headlines:
                return {
                    "success": True,
                    "headlines": headlines,
                    "message": "Headlines generated using Groq (llama3-8b-8192).",
                }
        except Exception as e:
            print(f"[AI] Groq error in generate_headline: {e}")

    # --- Try OpenAI next ---
    if openai_client:
        try:
            resp = openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.8,
                max_tokens=200,
            )
            headlines = parse_headlines(resp.choices[0].message.content)
            if headlines:
                return {
                    "success": True,
                    "headlines": headlines,
                    "message": "Headlines generated using OpenAI (gpt-3.5-turbo).",
                }
        except Exception as e:
            print(f"[AI] OpenAI error in generate_headline: {e}")

    # --- Fallback: template headlines ---
    headlines = [
        f"Everything You Need to Know About {short}",
        f"Getting Started with {short}",
        f"Practical Guide: How to Use {short} in Real Life",
        f"{short}: Key Concepts and Simple Examples",
        f"Why {short} Matters More Than Ever Today",
    ]

    return {
        "success": True,
        "headlines": headlines,
        "message": "Headlines generated using simple templates (no external API).",
    }


# --- New Feature: Plagiarism/AI Detection ---
class PlagiarismRequest(BaseModel):
    content: str
    language: Optional[str] = "English"

@router.post("/plagiarism-check")
def check_plagiarism(request: PlagiarismRequest):
    groq_client = get_groq_client()
    language = request.language or "English"
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq API key missing")
    try:
        # Simulate checking by asking AI if it looks like AI generated
        # NOTE: This is NOT a real plagiarism checker (which requires searching the web).
        # It's a "AI Pattern Detector" simulation.
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": f"You are an AI detection tool. Analyze the text for AI generation patterns. Provide an 'Originality Score' (0-100) and a brief analysis in {language}. Output format:\nScore: [Number]\nAnalysis: [Explanation]"},
                {"role": "user", "content": f"Analyze this text:\n\n{request.content}"},
            ],
            temperature=0.3,
            max_tokens=300,
        )
        analysis_text = completion.choices[0].message.content
        
        # Parse the response
        import re
        score_match = re.search(r'Score:\s*(\d+)', analysis_text)
        score = int(score_match.group(1)) if score_match else 50
        analysis_match = re.search(r'Analysis:\s*(.*)', analysis_text, re.DOTALL)
        analysis = analysis_match.group(1).strip() if analysis_match else "Could not determine analysis."

        is_original = score > 70 # Threshold for "original"
        
        return {
            "success": True,
            "originality_score": score,
            "is_original": is_original,
            "message": f"Groq Analysis in {language}: {analysis}"
        }
    except Exception as e:
        print(f"[AI] Groq error in plagiarism_check: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class GrammarCheckRequest(BaseModel):
    content: str
    language: Optional[str] = "English"

@router.post("/grammar-check")
def grammar_check(request: GrammarCheckRequest):
    groq_client = get_groq_client()
    language = request.language or "English"
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq API key missing")
    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": f"You are a strict grammar editor. Fix all grammar, spelling, punctuation, and awkward phrasing in the text. Return ONLY the corrected text. Do not add any explanations. Output in {language}."},
                {"role": "user", "content": f"Original Text:\n{request.content}\n\nCorrected Text:"},
            ],
            temperature=0.2,
            max_tokens=2000,
        )
        return {
            "success": True,
            "corrected_content": completion.choices[0].message.content,
            "message": f"Grammar checked using Groq (llama-3.3-70b-versatile) in {language}.",
        }
    except Exception as e:
        print(f"[AI] Groq error in grammar_check: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class ImageCaptionRequest(BaseModel):
    image_base64: str
    language: Optional[str] = "English"

@router.post("/image-caption")
def generate_image_caption(request: ImageCaptionRequest):
    groq_client = get_groq_client()
    language = request.language or "English"
    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.2-11b-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": f"Describe this image in detail. Output the description in {language}."},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{request.image_base64}"
                            },
                        },
                    ],
                }
            ],
            temperature=0.5,
            max_tokens=500,
            top_p=1,
            stream=False,
            stop=None,
        )
        return {"caption": completion.choices[0].message.content}
    except Exception as e:
        print(f"Error generating caption: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate caption")


@router.post("/analyze-image")
def analyze_image(request: ImageAnalysisRequest):
    """Analyze an image to generate a detailed description for blog writing."""
    groq_client = get_groq_client()
    openai_client = get_openai_client()
    
    # Reuse the ImageAnalysisRequest (image_base64)
    image_data = request.image_base64
    if "," in image_data:
        image_data = image_data.split(",")[1]
    
    system_prompt = "You are an expert visual analyst. Describe this image in great detail. Focus on the main subject, setting, colors, mood, and any text visible. The goal is to use this description to write a full blog post."
    user_prompt = "Describe this image in detail for a blog post."
    
    # Log usage
    log_ai_usage("image_analyzer")

    last_error = "No clients available"

    # --- Try Groq first (Llama Vision) ---
    if groq_client:
        try:
            resp = groq_client.chat.completions.create(
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": user_prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_data}"
                                },
                            },
                        ],
                    }
                ],
                temperature=0.6,
                max_tokens=500,
            )
            return {
                "success": True,
                "caption": resp.choices[0].message.content,
                "message": "Image analysis generated using Groq Vision."
            }
        except Exception as e:
            print(f"[AI] Groq Vision error in analyze: {e}")

    # --- Try OpenAI next ---
    if openai_client:
        try:
            resp = openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": user_prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_data}"
                                },
                            },
                        ],
                    }
                ],
                max_tokens=500,
            )
            return {
                "success": True,
                "caption": resp.choices[0].message.content,
                "message": "Image analysis generated using OpenAI GPT-4o."
            }

        except Exception as e:
            print(f"[AI] OpenAI Vision error in analyze: {e}", flush=True)
            last_error = str(e)

    return {
        "success": False,
        "caption": f"Vision AI failed. Last error: {last_error}",
        "message": f"Vision AI failed: {last_error}"
    }


@router.post("/generate-image")
def generate_image(request: GenerateImageRequest):
    """Image generation is disabled (requires OpenAI)."""
    return {
        "success": False,
        "message": "Image generation is currently disabled (requires OpenAI API Key)."
    }

class TextToSpeechRequest(BaseModel):
    text: str
    voice: str = "alloy"

@router.post("/text-to-speech")
def text_to_speech(request: TextToSpeechRequest):
    """TTS is disabled (requires OpenAI)."""
    return {
        "success": False,
        "message": "Text-to-Speech is currently disabled (requires OpenAI API Key)."
    }

class TranslateRequest(BaseModel):
    text: str
    target_language: str

@router.post("/translate")
def translate_text(request: TranslateRequest):
    """Translate text using Groq."""
    groq_client = get_groq_client()
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq API key missing")

    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": f"You are a professional translator. Translate the following text into {request.target_language}. Return ONLY the translated text, no explanations."
                },
                {"role": "user", "content": request.text},
            ],
            temperature=0.3,
            max_tokens=2000,
            top_p=1,
        )
        translated_text = completion.choices[0].message.content
        return {"translated_text": translated_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



class ToneRequest(BaseModel):
    content: str
    tone: str

class GrammarCheckRequest(BaseModel):
    content: str

@router.post("/grammar-check")
def grammar_check(request: GrammarCheckRequest):
    """Fix grammar and spelling errors."""
    groq_client = get_groq_client()
    openai_client = get_openai_client()
    
    content = request.content
    
    system_prompt = "You are an expert editor and proofreader. Fix all grammar, spelling, punctuation, and awkward phrasing in the text. Return ONLY the corrected text. Do not add any explanations."
    user_prompt = f"Original Text:\n{content}\n\nCorrected Text:"

    # --- Try Groq first ---
    if groq_client:
        try:
            resp = groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.1, 
                max_tokens=2000,
            )
            return {
                "success": True,
                "corrected_content": resp.choices[0].message.content,
                "message": "Grammar checked using Groq."
            }
        except Exception as e:
            print(f"[AI] Groq error in grammar_check: {e}")

    # --- Try OpenAI next ---
    if openai_client:
        try:
            resp = openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.1,
                max_tokens=2000,
            )
            return {
                "success": True,
                "corrected_content": resp.choices[0].message.content,
                "message": "Grammar checked using OpenAI."
            }
        except Exception as e:
            print(f"[AI] OpenAI error in grammar_check: {e}")

    return {
        "success": False,
        "corrected_content": content,
        "message": "Could not check grammar. Backend error."
    }


@router.post("/change-tone")
def change_tone(request: ToneRequest):
    """Rewrite text in a specific tone."""
    print(f"DEBUG: change_tone called with tone='{request.tone}'")
    groq_client = get_groq_client()
    openai_client = get_openai_client()
    
    content = request.content
    tone = request.tone
    
    system_prompt = f"You are an expert editor. Rewrite the following text to have a '{tone}' tone. Keep the meaning the same, but change the style and vocabulary."
    user_prompt = f"Original Text:\n{content}\n\nRewritten Text ({tone}):"

    # --- Try Groq first ---
    if groq_client:
        try:
            resp = groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.7,
                max_tokens=1000,
            )
            return {
                "success": True,
                "content": resp.choices[0].message.content,
                "message": f"Tone changed to {tone} using Groq.",
            }
        except Exception as e:
            print(f"[AI] Groq error in change_tone: {e}")

    # --- Try OpenAI next ---
    if openai_client:
        try:
            resp = openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.7,
                max_tokens=1000,
            )
            return {
                "success": True,
                "content": resp.choices[0].message.content,
                "message": f"Tone changed to {tone} using OpenAI.",
            }
        except Exception as e:
            print(f"[AI] OpenAI error in change_tone: {e}")

    return {
        "success": False,
        "content": "Could not change tone. Please check backend logs.",
    }
