
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Customer } from "@/lib/types"

interface CustomerComboboxProps {
  customers: Customer[];
  onCustomerSelect: (customerId: string) => void;
  selectedCustomerId: string | null;
}

export function CustomerCombobox({ customers, onCustomerSelect, selectedCustomerId }: CustomerComboboxProps) {
  const [open, setOpen] = React.useState(false)
  
  const selectedCustomerName = customers.find((c) => c.id === selectedCustomerId)?.name || "Select a customer..."

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedCustomerName}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search customer by name or email..." />
          <CommandList>
            <CommandEmpty>
                <div className="p-4 text-sm text-center">
                    No customer found.
                    {/* <Button variant="link" className="h-auto p-0 ml-1" onClick={() => {
                        // Logic to open a "New Customer" dialog can be added here
                    }}>
                        Create a new one?
                    </Button> */}
                </div>
            </CommandEmpty>
            <CommandGroup>
              {customers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={customer.name}
                  onSelect={(currentValue) => {
                    const selected = customers.find(c => c.name.toLowerCase() === currentValue.toLowerCase());
                    if (selected) {
                      onCustomerSelect(selected.id)
                    }
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedCustomerId === customer.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div>
                    <p>{customer.name}</p>
                    <p className="text-xs text-muted-foreground">{customer.email}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
