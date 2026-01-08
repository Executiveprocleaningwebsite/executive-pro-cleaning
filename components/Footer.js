import Link from "next/link";

const NCS_URL = "https://nightingalecybersolutions.com"; // change later when your site is live
const INSTAGRAM_URL =
  "https://www.instagram.com/cleaningexecutivepro/?igsh=MXZzNmtkZzh4emZl&utm_source=qr#";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footerRow">
          <div>
            <div>
              <strong>Executive Pro Cleaning</strong>
            </div>
            <div>Canberra • Queanbeyan • Royalla</div>
            <div>ABN: 34 309 068 939</div>
          </div>

          <div className="footerLinks">
            <div className="footerLinksPrimary" aria-label="Contact links">
              <a href="tel:0478762814">Call 0478 762 814</a>
              <a href="mailto:ExecutiveProCleaning9@gmail.com">Email</a>
              <a
                href="https://www.facebook.com/share/1Bxh9ePBqc/?mibextid=wwXIfr"
                target="_blank"
                rel="noreferrer"
              >
                Facebook
              </a>
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
                Instagram
              </a>
            </div>

            <div className="footerLinksLegal" aria-label="Legal links">
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/accessibility">Accessibility</Link>
            </div>
          </div>
        </div>

        <div className="footerBottom">
          <span>
            © {year} Executive Pro Cleaning | Website by{" "}
            <a href={NCS_URL} target="_blank" rel="noreferrer">
              Nightingale Cyber Solutions
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}