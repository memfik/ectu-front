import { PageHero } from "@/components/shared/page-hero"
import { KpiCard } from "@/components/shared/kpi-card"

/** Главная (макет 06). TODO: реальные данные из API. */
export default function HomePage() {
  return (
    <PageHero title="Главная">
      <KpiCard label="Узлов связи" value="—" />
      <KpiCard label="Оборудования" value="—" />
      <KpiCard label="Аварий" value="—" />
      <KpiCard label="Заявок" value="—" />
    </PageHero>
  )
}
