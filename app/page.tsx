"use client";

import NavigationActionCard from "@/components/NavigationCard";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const router = useRouter();

  return (
    <div>
      <header>
        <div
          className="px-10 py-5 cursor-pointer"
          onClick={() => router.push("/")}
        >
          <Image
            src={"/images/Brand_Logo_Wardrobe.png"}
            alt={"Home solution wardrobe planner logo"}
            width={160}
            height={48}
            className="w-auto h-12 object-cover"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 px-10 py-10">
        <div className="relative bg-gradient-to-br from-[var(--tertiary)] to-[var(--primary)]  h-120 hidden lg:block lg:col-span-2">
          <div className="absolute top-[10%] left-[5%] w-40">
            <Image
              src={"/images/Design_Your_Wardrobe_Logo.png"}
              alt="logo"
              width={160}
              height={100}
            />
          </div>
          <p className="text-primary-foreground text-4xl lg:text-5xl font-bold absolute top-[40%] left-[6%] leading-20 z-100">
            Design your
            <br /> Wardrobe
          </p>
        </div>

        <NavigationActionCard
          imageSrc={"/images/Planning_Tool.avif"}
          imageAlt={"Flexi Storage Wardrobe Planning Tool"}
          title="Flexi Storage Wardrobe Planning Tool"
          description="Create your own storage solution"
          bgColor="var(--primary)"
          textColor="var(--primary-foreground)"
          type="link"
        />

        <NavigationActionCard
          imageSrc={"/images/Open_A_Saved_Design.webp"}
          imageAlt={"Open a saved design"}
          title="Open a saved design"
          description="Enter a design code"
          bgColor="var(--secondary)"
          textColor="var(--tertiary)"
          type="openSheet"
        />
      </div>
    </div>
  );
}
