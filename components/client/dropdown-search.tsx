"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/app/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function DropdownSearch({ options, setToken }: { options: { label: string; value: string }[]; setToken: (value: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

  function handleSelect(value: string) {
    setOpen(false);
    setValue(value);
    setToken(value);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between selection:bg-[#333] selection:border-[#333] selection:text-[#fff] selection:rounded-md selection:px-3 selection:py-2 selection:cursor-pointer"
        >
          {value ? options.find((option) => option.value === value)?.label : "Select token..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] bg-[#000] border-[#333]">
        <Command>
          <CommandInput placeholder="Search token..." />
          <CommandEmpty>No option found.</CommandEmpty>
          <CommandGroup>
            {options.map((option) => (
              <Button
                className="text-left  border-[#333]"
                key={option.value}
                defaultValue={option.value}
                onClick={() => {
                  handleSelect(option.value);
                }}
              >
                <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                {option.label}
              </Button>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
