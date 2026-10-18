import { Suspense } from "react";
import { DetailProdi } from "./DetailProdi";

export default function DetailProdiPage() {
  return (
    <Suspense fallback={null}>
      <DetailProdi />
    </Suspense>
  );
}
