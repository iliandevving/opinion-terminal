"use client";

import { HStack, Text, Icon } from "@chakra-ui/react";
import { ChevronRight } from "lucide-react";
import { BreadcrumbItem } from "@/types/navigation";

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb = ({ items }: BreadcrumbProps) => {
  return (
    <HStack color="gray.600" fontSize="sm" mb={3}>
      {items.map((item, index) => (
        <HStack key={index} gap={2}>
          {item.icon && (
            <Icon>
              <item.icon />
            </Icon>
          )}
          <Text>{item.label}</Text>
          {index < items.length - 1 && (
            <Icon>
              <ChevronRight />
            </Icon>
          )}
        </HStack>
      ))}
    </HStack>
  );
};

