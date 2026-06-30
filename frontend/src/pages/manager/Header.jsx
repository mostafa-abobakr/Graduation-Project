import React from "react"
import { LayoutDashboard } from "lucide-react"
import { ViewToggler } from "@/components/shared/ViewToggler"
import { PageHeader } from "@/components/shared/PageHeader"
import { useLanguage } from "@/contexts/LanguageContext"

const Header = ({ viewMode, setViewMode }) => {
  const { t } = useLanguage()

  return (
    <PageHeader
      icon={LayoutDashboard}
      title={t("Manager Dashboard")}
      description={t("Manage your business operations")}
      actions={
        <ViewToggler viewMode={viewMode} setViewMode={setViewMode} />
      }
    />
  )
}

export default Header
