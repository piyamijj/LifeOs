export const metadata = {
  title: "LifeOS Gemini",
  description: "Powered by Google Gemini",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily: "sans-serif",
          background: "#111",
          color: "#fff"
        }}
      >
        {children}
      </body>
    </html>
  );
}
