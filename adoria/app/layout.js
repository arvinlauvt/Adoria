import "./globals.css";

export const metadata = {
  title: "Adoria — Never Forget An Anniversary Again",
  description:
    "Bespoke Malaysian chocolate, hand-molded and boxed, delivered on your anniversary — with a card written the way you'd write it yourself.",
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
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,600;1,9..144,500&family=Manrope:wght@400;500;600;700&family=Herr+Von+Muellerhoff&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
