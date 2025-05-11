from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.user import get_user_by_id, update_user_subscription
from app.schemas.user import User
from app.schemas import user as schemas
from app.services import user as user_service
from app.core.config import settings
import stripe

router = APIRouter()

stripe.api_key = settings.STRIPE_SECRET_KEY

@router.get("/{user_id}", response_model=User)
async def read_user(user_id: str, db: Session = Depends(get_db)):
    """
    Get user by ID
    
    This endpoint returns user information for a given user ID
    """
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user 

@router.get("/me/subscription")
def get_my_subscription(user_id: str, db: Session = Depends(get_db)):
    db_user = user_service.get_user_by_id(db, user_id)
    if not db_user:
        return {"subscription_type": "Free"}
    return {"subscription_type": db_user.subscription_type or "Free"}

@router.put("/me/subscription", response_model=schemas.User)
def update_my_subscription(user_id: str, subscription_type: str, db: Session = Depends(get_db)):
    db_user = user_service.get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    db_user.subscription_type = subscription_type
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/stripe/webhook")
def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = request.body()
    sig_header = request.headers.get("stripe-signature")
    webhook_secret = settings.STRIPE_WEBHOOK_SECRET
    event = None
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook error: {str(e)}")
    # Handle the event
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session.get("client_reference_id")
        # TODO: Determine plan from session/line_items
        new_plan = "Basic"  # or "Pro" based on price ID
        update_user_subscription(db, user_id, new_plan)
    # Add more event types as needed
    return {"status": "success"}

@router.post("/create-checkout-session")
def create_checkout_session(user_id: str, plan: str):
    # Map plan to Stripe price ID (replace with your actual price IDs)
    price_ids = {
        "Basic": "price_basic_id",
        "Pro": "price_pro_id",
    }
    if plan not in price_ids:
        raise HTTPException(status_code=400, detail="Invalid plan")
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="subscription",
            line_items=[{"price": price_ids[plan], "quantity": 1}],
            success_url="https://pageyai.com/dashboard?session_id={CHECKOUT_SESSION_ID}",
            cancel_url="https://pageyai.com/dashboard",
            client_reference_id=user_id,
        )
        return {"url": session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 