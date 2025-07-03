"use client"

import * as React from "react"
import { SearchIcon, FilterIcon, SortAscIcon } from "lucide-react"
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { DATA_TYPES, SORT_OPTIONS } from './Constants'
import { FilterState } from './Types'
import { filterAndSortData } from './Utils'

interface SearchAndFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  resultCount: number
}

export function SearchAndFilters({ filters, onFiltersChange, resultCount }: SearchAndFiltersProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-sidebar-foreground/40" />
        <Input
          placeholder="Search data..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-10 sm:pl-12 pr-4 py-2 sm:py-3 bg-sidebar border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1 sm:gap-2 bg-sidebar-accent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent/80 flex-shrink-0 text-xs sm:text-sm"
        >
          <FilterIcon className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden xs:inline">Filters</span>
        </Button>
        
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
          {DATA_TYPES.map((type) => (
            <Button
              key={type.id}
              variant={filters.type === type.id ? "default" : "ghost"}
              size="sm"
              onClick={() => onFiltersChange({ ...filters, type: type.id })}
              className={`whitespace-nowrap flex-shrink-0 text-xs sm:text-sm ${
                filters.type === type.id
                  ? "bg-sidebar-foreground text-sidebar hover:bg-sidebar-foreground/90"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <type.icon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {type.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Sort and Results */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <SortAscIcon className="h-4 w-4 text-sidebar-foreground/60 flex-shrink-0" />
          <Select 
            value={filters.sortBy} 
            onValueChange={(value: 'newest' | 'oldest' | 'title') => 
              onFiltersChange({ ...filters, sortBy: value })
            }
          >
            <SelectTrigger className="w-full sm:w-[180px] bg-sidebar-accent border-sidebar-border text-sidebar-foreground text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-xs sm:text-sm">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <span className="text-xs sm:text-sm text-sidebar-foreground/60 whitespace-nowrap">
          {resultCount} {resultCount === 1 ? 'item' : 'items'}
        </span>
      </div>
    </div>
  )
}
