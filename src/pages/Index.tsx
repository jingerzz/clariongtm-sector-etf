import { Header } from "@/components/Header";
import { ETFGrid } from "@/components/ETFGrid";
import { NewsSidebar } from "@/components/NewsSidebar";
import { MarketFooter } from "@/components/MarketFooter";

const Index = () => {
  return (
    <div className="flex flex-col h-screen bg-[hsl(0,0%,4%)] text-[hsl(0,0%,90%)]">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <ETFGrid />
        <NewsSidebar />
      </div>
      <MarketFooter />
    </div>
  );
};

export default Index;
