import React from "react";
import { cn } from "../../lib/utils";

const TabsContext = React.createContext(undefined);

const useTabs = () => {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs provider");
  }
  return context;
};

export const Tabs = ({ defaultValue, children, className }) => {
  const [selectedTab, setSelectedTab] = React.useState(defaultValue);

  return (
    <TabsContext.Provider value={{ selectedTab, setSelectedTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabList = ({ children, className }) => {
  return (
    <div className={cn("flex space-x-1 border-b border-gray-200", className)}>
      {children}
    </div>
  );
};

export const TabTrigger = ({ value, children, className }) => {
  const { selectedTab, setSelectedTab } = useTabs();
  const isSelected = selectedTab === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      onClick={() => setSelectedTab(value)}
      className={cn(
        "px-4 py-2 text-sm font-medium transition-all",
        isSelected
          ? "border-b-2 border-green-600 text-green-700"
          : "text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300",
        className
      )}
    >
      {children}
    </button>
  );
};

export const TabContent = ({ value, children, className }) => {
  const { selectedTab } = useTabs();
  const isSelected = selectedTab === value;

  if (!isSelected) return null;

  return (
    <div role="tabpanel" className={cn("py-4", className)}>
      {children}
    </div>
  );
};
