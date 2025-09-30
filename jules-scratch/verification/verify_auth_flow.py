from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # --- Test Signup Flow ---
    page.goto("http://localhost:5173/")

    # Enter email and click send
    page.get_by_placeholder("name@example.com").fill("test-signup@example.com")
    page.get_by_role("button", name="Send Verification Code").click()

    # Wait for the UI to update
    expect(page.get_by_text("We sent a 6-digit code to your email.")).to_be_visible()
    expect(page.get_by_label("Verification Code")).to_be_visible()

    # Take a screenshot of the signup verification step
    page.screenshot(path="jules-scratch/verification/signup_verification.png")

    # --- Test Login Flow ---
    page.goto("http://localhost:5173/login")

    # Enter email and click send
    page.get_by_placeholder("name@example.com").fill("test-login@example.com")
    page.get_by_role("button", name="Send 6‑digit code").click()

    # Wait for the UI to update
    expect(page.get_by_label("Enter 6‑digit code")).to_be_visible()

    # Take a screenshot of the login verification step
    page.screenshot(path="jules-scratch/verification/login_verification.png")

    context.close()
    browser.close()

with sync_playwright() as playwright:
    run(playwright)