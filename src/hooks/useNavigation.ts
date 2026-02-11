"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
} from "lucide-react";
import { NavigationItem } from "@/types/navigation";

export const useNavigation = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [activeItem, setActiveItem] = useState("terminal");

  // Set active item based on current pathname
  useEffect(() => {
    // Terminal is the only page now
    setActiveItem("terminal");
  }, [pathname]);

  const mainItems: NavigationItem[] = [
    {
      id: "terminal",
      icon: BarChart3,
      label: "Terminal",
      href: "/",
      active: activeItem === "terminal",
    },
  ];

  const bottomItems: NavigationItem[] = [];

  const setActive = (itemId: string) => {
    setActiveItem(itemId);
    const allItems = [...mainItems, ...bottomItems];
    const item = allItems.find((item) => item.id === itemId);

    if (item && item.href && !item.comingSoon && pathname !== item.href) {
      router.push(item.href);
    }
  };

  return {
    mainItems,
    bottomItems,
    activeItem,
    setActive,
  };
};
