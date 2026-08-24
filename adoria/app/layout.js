import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata = {
  title: "Cubelle — For The Moments Worth Archiving",
  description:
    "Luxury gift boxes for the moments worth marking — hand-baked Malaysian Cubelles, set in a matte black box, with a message written in gold ink.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="true"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Manrope:wght@300;400;500;600;700&family=Parisienne&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Herr+Von+Muellerhoff&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
