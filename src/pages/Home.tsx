import NavigationActionCard from "@/components/NavigationCard";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div>
      <header>
        <div
          className="px-10 py-5 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img
            src={"/images/Brand_Logo_Wardrobe.png"}
            width={250}
            height={250}
            alt={"Home solution wardrobe planner logo"}
          />
        </div>
      </header>
      <div className="grid grid-cols-2 gap-4 px-10">
        <div className="relative bg-primary h-140">
          <div className="absolute top-[10%] left-[5%] ">
            <img src={"/images/Design_Your_Wardrobe_Logo.png"} alt="logo" />
          </div>
          <p className="text-primary-foreground text-6xl font-bold absolute top-[40%] left-[5%] leading-20 z-100">
            Design your
            <br /> Wardrobe
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <NavigationActionCard
            imageSrc={"/images/Planning_Tool.avif"}
            imageAlt={"Flexi Storage Wardrobe Planning Tool"}
            title="Flexi Storage Wardrobe Planning Tool"
            description="Create your own storage solution"
            bgColor="var(--tertiary)"
            textColor="var(--primary-foreground)"
            type="link"
          />

          <NavigationActionCard
            imageSrc={"/images/Open_A_Saved_Design.avif"}
            imageAlt={"Open a saved design"}
            title="Open a saved design"
            description="Enter a design code"
            bgColor="var(--secondary)"
            textColor="var(--tertiary)"
            type="openSheet"
          />
        </div>
      </div>
    </div>
  );
}
