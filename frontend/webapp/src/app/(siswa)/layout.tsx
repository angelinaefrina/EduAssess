// (siswa) layout: passes children through.
// Each page in this group manages its own header/footer via shared components.
export default function SiswaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
