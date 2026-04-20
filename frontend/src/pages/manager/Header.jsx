import React from "react";
import { LayoutDashboard } from "lucide-react";
import { ViewToggler } from "@/components/shared/ViewToggler";
import { PageHeader } from "@/components/shared/PageHeader";

const Header = ({ viewMode, setViewMode }) => {
  return (
    <PageHeader
      icon={LayoutDashboard}
      title="Manager Dashboard"
      description="Manage your business operations"
      actions={
        <ViewToggler viewMode={viewMode} setViewMode={setViewMode} />
      }
    />
  );
};

export default Header;
