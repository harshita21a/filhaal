from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import re
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Annotated

import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, BeforeValidator

# ---------------- DB ----------------
import certifi
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url, tlsCAFile=certifi.where())
db = client[os.environ['DB_NAME']]

# ---------------- Auth config ----------------
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
ADMIN_PASSWORD = os.environ['ADMIN_PASSWORD']

# ---------------- Image storage config (Cloudinary) ----------------
# NOTE: We originally stored uploaded images on the backend's local disk.
# That works for local development, but on hosting platforms like Render's
# free tier, the disk is wiped every time the server restarts or wakes up
# from sleep — so uploaded images would silently disappear after a while.
# Cloudinary stores images permanently on its own servers instead.
import cloudinary
import cloudinary.uploader

cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
    secure=True,
)
APP_NAME = os.environ.get("APP_NAME", "filhaal")

CATEGORIES = ["Songs", "Books", "Websites", "Currently Into"]

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ---------------- Models ----------------
PyObjectId = Annotated[str, BeforeValidator(str)]


def now_iso():
    return datetime.now(timezone.utc).isoformat()


class Embed(BaseModel):
    type: str = "link"   # link | image | audio | video
    url: str = ""
    label: Optional[str] = ""


class PostBase(BaseModel):
    title: str
    category: str
    excerpt: str = ""
    cover_image: str = ""
    body: str = ""
    personal_note: str = ""
    embeds: List[Embed] = []
    featured: bool = False
    published: bool = True


class PostCreate(PostBase):
    pass


class Post(PostBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


class LoginRequest(BaseModel):
    password: str
class SuggestionCreate(BaseModel):
    category: str
    title: str
    note: str = ""
    name: str = ""


class Suggestion(SuggestionCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=now_iso)


def slugify(title: str) -> str:
    base = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
    return f"{base[:60]}-{uuid.uuid4().hex[:6]}"


def create_token() -> str:
    payload = {
        "sub": "admin",
        "role": "admin",
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


security = HTTPBearer(auto_error=False)


async def require_admin(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("role") != "admin":
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    return True


# ---------------- App ----------------
app = FastAPI()
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"message": "filhaal api"}


@api_router.get("/categories")
async def get_categories():
    return CATEGORIES


# --- Auth ---
@api_router.post("/admin/login")
async def admin_login(payload: LoginRequest):
    if payload.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Incorrect password")
    return {"token": create_token()}


@api_router.get("/admin/verify")
async def admin_verify(_: bool = Depends(require_admin)):
    return {"ok": True}


# --- Public posts ---
@api_router.get("/posts")
async def list_posts(category: Optional[str] = None, search: Optional[str] = None):
    query = {"published": True}
    if category and category != "All":
        query["category"] = category
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"excerpt": {"$regex": search, "$options": "i"}},
            {"body": {"$regex": search, "$options": "i"}},
        ]
    docs = await db.posts.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


@api_router.get("/posts/featured")
async def featured_post():
    doc = await db.posts.find_one({"published": True, "featured": True}, {"_id": 0}, sort=[("created_at", -1)])
    if not doc:
        doc = await db.posts.find_one({"published": True}, {"_id": 0}, sort=[("created_at", -1)])
    return doc


@api_router.get("/posts/{slug}")
async def get_post(slug: str):
    doc = await db.posts.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Post not found")
    return doc

# --- Suggestions (public — anyone can submit and view) ---
SUGGESTION_CATEGORIES = ["Song", "Book", "Website", "Watch", "Other"]


@api_router.get("/suggestions/categories")
async def get_suggestion_categories():
    return SUGGESTION_CATEGORIES


@api_router.get("/suggestions")
async def list_suggestions():
    docs = await db.suggestions.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


@api_router.post("/suggestions")
async def create_suggestion(payload: SuggestionCreate):
    if not payload.title.strip():
        raise HTTPException(status_code=400, detail="Please add a title")
    if payload.category not in SUGGESTION_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    suggestion = Suggestion(**payload.model_dump())
    await db.suggestions.insert_one(suggestion.model_dump())
    return suggestion.model_dump()
# --- Admin posts ---
@api_router.get("/admin/posts")
async def admin_list_posts(_: bool = Depends(require_admin)):
    docs = await db.posts.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


@api_router.post("/admin/posts")
async def create_post(payload: PostCreate, _: bool = Depends(require_admin)):
    if payload.category not in CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    post = Post(slug=slugify(payload.title), **payload.model_dump())
    if post.featured:
        await db.posts.update_many({"featured": True}, {"$set": {"featured": False}})
    await db.posts.insert_one(post.model_dump())
    return post.model_dump()


@api_router.put("/admin/posts/{post_id}")
async def update_post(post_id: str, payload: PostCreate, _: bool = Depends(require_admin)):
    existing = await db.posts.find_one({"id": post_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Post not found")
    if payload.category not in CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    update = payload.model_dump()
    update["updated_at"] = now_iso()
    if payload.featured:
        await db.posts.update_many({"featured": True, "id": {"$ne": post_id}}, {"$set": {"featured": False}})
    await db.posts.update_one({"id": post_id}, {"$set": update})
    doc = await db.posts.find_one({"id": post_id}, {"_id": 0})
    return doc


@api_router.delete("/admin/posts/{post_id}")
async def delete_post(post_id: str, _: bool = Depends(require_admin)):
    res = await db.posts.delete_one({"id": post_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"ok": True}


# --- Uploads (stored permanently on Cloudinary) ---
@api_router.post("/upload")
async def upload(file: UploadFile = File(...), _: bool = Depends(require_admin)):
    data = await file.read()
    try:
        result = cloudinary.uploader.upload(
            data,
            folder=APP_NAME,
            public_id=uuid.uuid4().hex,
            resource_type="image",
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Image upload failed: {e}")
    secure_url = result["secure_url"]
    await db.files.insert_one({
        "id": str(uuid.uuid4()),
        "storage_path": result.get("public_id"),
        "url": secure_url,
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": len(data),
        "is_deleted": False,
        "created_at": now_iso(),
    })
    return {"url": secure_url, "path": result.get("public_id")}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------- Seed ----------------
SEED_POSTS = [
    {
        "title": "The song I can't stop replaying this week",
        "category": "Songs",
        "excerpt": "A slow-burning ballad that feels like driving home at 2am with the windows down.",
        "cover_image": "https://images.unsplash.com/photo-1603048588665-791ca8aea617",
        "body": "<p>There is a particular kind of song that arrives quietly and then refuses to leave. This one found me on a grey Tuesday and has been the soundtrack to every small moment since.</p><p>The production is sparse — a single piano, a voice that cracks in all the right places, and a chorus that never quite resolves. It is the sound of longing.</p><blockquote>Music is the space between the notes.</blockquote>",
        "personal_note": "I played this on loop while writing letters I'll probably never send. Highly recommend for anyone in a reflective mood.",
        "embeds": [{"type": "link", "url": "https://open.spotify.com", "label": "Listen on Spotify"}],
        "featured": True,
        "published": True,
    },
    {
        "title": "A novel that rearranged how I see mornings",
        "category": "Books",
        "excerpt": "Three hundred pages of quiet observation that made me want to slow everything down.",
        "cover_image": "https://images.unsplash.com/photo-1608499500238-1536c6dd482f",
        "body": "<p>I finished this book in two sittings and immediately started again. It is the kind of writing that makes ordinary life feel cinematic.</p><p>The author lingers on small things — the steam off a cup of coffee, the light through a curtain — until they become the whole point.</p>",
        "personal_note": "Read it slowly. This is not a book to rush.",
        "embeds": [],
        "featured": False,
        "published": True,
    },
    {
        "title": "A website that feels like a secret",
        "category": "Websites",
        "excerpt": "A tiny, beautifully made corner of the internet that reminds me why I fell in love with the web.",
        "cover_image": "https://images.pexels.com/photos/5793947/pexels-photo-5793947.jpeg",
        "body": "<p>Every so often you stumble onto a website that was clearly made with love rather than metrics in mind. This is one of them.</p><p>No pop-ups, no cookie banners the size of a billboard — just craft.</p>",
        "personal_note": "Bookmark it and revisit when the internet feels too loud.",
        "embeds": [{"type": "link", "url": "https://example.com", "label": "Visit the site"}],
        "featured": False,
        "published": True,
    },
    {
        "title": "Currently into: long walks without headphones",
        "category": "Currently Into",
        "excerpt": "A small ritual I picked up this month that has quietly changed my days.",
        "cover_image": "https://images.unsplash.com/photo-1769117620390-b73d3eecc09c",
        "body": "<p>I've started leaving my headphones at home. At first the silence was uncomfortable. Now it feels like a luxury.</p><p>You notice more — conversations, birds, the texture of a street you've walked a hundred times.</p>",
        "personal_note": "Try it for a week. You'll be surprised what you hear.",
        "embeds": [],
        "featured": False,
        "published": True,
    },
]


@app.on_event("startup")
async def startup():
    await db.posts.create_index("slug", unique=True)
    await db.posts.create_index("id", unique=True)
    count = await db.posts.count_documents({})
    if count == 0:
        for p in SEED_POSTS:
            post = Post(slug=slugify(p["title"]), **p)
            await db.posts.insert_one(post.model_dump())
        logger.info("Seeded sample posts")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
