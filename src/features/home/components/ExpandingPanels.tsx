import Panel from '@/features/home/components/Panel'
import { HOME_PANELS } from '@/features/home/constants'

/**
 * 5분할 확장 패널.
 *
 * lg 이상: 가로로 균등 분할 → hover/focus한 패널만 확장(1.76 : 1).
 * lg 미만: 확장 없이 세로로 쌓이고, 콘텐츠는 항상 전부 보인다.
 */
export default function ExpandingPanels() {
  return (
    <div className="flex w-full flex-col lg:h-full lg:flex-row">
      {HOME_PANELS.map((panel) => (
        <Panel key={panel.id} panel={panel} />
      ))}
    </div>
  )
}
