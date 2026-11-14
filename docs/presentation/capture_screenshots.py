"""Capture real screenshots of the running Ckepi frontend (branch kevin)."""

from __future__ import annotations

from pathlib import Path
from playwright.sync_api import sync_playwright

CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
BASE_URL = "http://127.0.0.1:5173"


def main() -> None:
    out_dir = Path(__file__).resolve().parent
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl"],
        )
        page = browser.new_page(viewport={"width": 1440, "height": 900}, device_scale_factor=2)

        # 1. Mars Jezero Crater (English, top hero with 3D globes + H3 grid)
        page.goto(f"{BASE_URL}/?site=mars_jezero_crater", wait_until="domcontentloaded")
        page.wait_for_timeout(4500)
        page.screenshot(path=str(out_dir / "shot_explorer_mars.png"))

        # 2. Scroll to Causal Decomposition + Mission Diagnostics + Comparison Matrix
        page.evaluate("window.scrollTo(0, 760)")
        page.wait_for_timeout(1500)
        page.screenshot(path=str(out_dir / "shot_atacama_analysis.png"))

        # 3. Moon Shackleton Crater (top hero)
        page.goto(f"{BASE_URL}/?site=moon_shackleton_pole", wait_until="domcontentloaded")
        page.wait_for_timeout(4500)
        page.screenshot(path=str(out_dir / "shot_explorer_moon.png"))

        browser.close()
    print("Captured screenshots successfully.")


if __name__ == "__main__":
    main()
