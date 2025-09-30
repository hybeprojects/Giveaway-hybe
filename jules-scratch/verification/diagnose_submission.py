from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Listen for console messages and print them
    page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))

    try:
        page.goto("http://localhost:3002/entry")

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

        # Click submit
        submit_button = page.get_by_role("button", name="Submit Entry")
        submit_button.click()

        # Wait to see what happens after submission attempt
        page.wait_for_timeout(5000)

        # Take a screenshot for debugging
        page.screenshot(path="jules-scratch/verification/submission_attempt.png")

    except Exception as e:
        print(f"An error occurred during the test: {e}")
        page.screenshot(path="jules-scratch/verification/error_screenshot.png")
        raise

    finally:
        context.close()
        browser.close()

with sync_playwright() as playwright:
    run(playwright)