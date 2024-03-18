import dynamic from "next/dynamic";

const DeckBuilder = dynamic(() => import("./_page"), { ssr: false });

export default function Page() {
  return (
    <div>
      <DeckBuilder />
    </div>
  );
}
