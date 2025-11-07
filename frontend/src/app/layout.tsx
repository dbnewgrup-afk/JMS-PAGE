export const metadata = {
  title: "JMS",
  description: "Aplikasi internal JMS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      style={{
        margin: 0,
        padding: 0,
        height: "100%",
        width: "100%",
      }}
    >
      <body
        style={{
          margin: 0,
          padding: 0,
          height: "100%",
          width: "100%",
          overflowX: "hidden",
          overflowY: "auto",
          backgroundColor: "#000",
        }}
      >
        {children}
      </body>
    </html>
  );
}
