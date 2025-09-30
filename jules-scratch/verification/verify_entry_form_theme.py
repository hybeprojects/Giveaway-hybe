import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Navigate to the entry form page
        await page.goto("http://localhost:5173/entry")

        # Wait for the main heading to be visible to ensure the page is loaded
        heading = page.get_by_role("heading", name="Giveaway Entry Form")
        await expect(heading).to_be_visible()

        # Also wait for the footer to be visible to ensure the whole page is rendered
        footer = page.get_by_role("contentinfo")
        await expect(footer).to_be_visible()

        # Take a screenshot of the refactored form with the new theme
        await page.screenshot(path="/app/jules-scratch/verification/verification.png")

        await browser.close()

asyncio.run(main())