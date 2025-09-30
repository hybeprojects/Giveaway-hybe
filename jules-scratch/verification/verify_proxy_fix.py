from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # The Netlify dev server runs on port 8888
        page.goto("http://localhost:8888/entry")

        # Fill in all required fields
        page.locator("#full-name").fill("Test User")
        page.locator("#dob").fill("2000-01-01")
        page.locator("#gender").select_option("Male")
        page.locator("#email").fill("testuser@example.com")
        page.locator("input#phone").fill("+12133734253")
        page.locator("#address-line1").fill("123 Main St")
        page.locator("#city").fill("Anytown")
        page.locator("#postal-code").fill("12345")
        page.locator("#country-select").select_option("USA")
        page.locator("#branch").select_option("BIGHIT")
        page.locator("#group").select_option("BTS")
        page.locator("#artist").select_option("RM")

        # Submit the form (as an unauthenticated user)
        submit_button = page.get_by_role("button", name="Submit Entry")
        submit_button.click()

        # With the proxy fixed, we should now get the "Unauthorized" error from the backend
        submission_error = page.locator(".alert-danger")
        expect(submission_error).to_be_visible()
        expect(submission_error).to_have_text("Unauthorized")

        # Take a screenshot of the server error
        page.screenshot(path="jules-scratch/verification/verification.png")

    finally:
        context.close()
        browser.close()

with sync_playwright() as playwright:
    run(playwright)