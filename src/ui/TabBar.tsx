import './TabBar.css'

type Props = {
  tabs: readonly string[]
  active: string
  onSelect: (tab: string) => void
}

export function TabBar({ tabs, active, onSelect }: Props) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab}
          role="tab"
          type="button"
          aria-selected={tab === active}
          className={tab === active ? 'tabs__item tabs__item--active' : 'tabs__item'}
          onClick={() => onSelect(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
