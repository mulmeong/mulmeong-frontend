import { cn } from '@/lib/cn'

type StarRatingProps = {
  /** 1~5. 아직 안 매겼으면 0. */
  value: number
  onChange: (value: number) => void
  /** 스크린 리더가 읽을 항목 이름. 예: '청결도' */
  label: string
  /** 전체 만족도는 조금 크게 쓴다. */
  size?: 'small' | 'large'
}

const STARS = [1, 2, 3, 4, 5]

const sizeStyles = {
  small: 'text-[15px]',
  large: 'text-[19px]',
} as const

/**
 * 별점 고르기.
 *
 * 버튼 다섯 개가 아니라 라디오 그룹으로 만든다 — 화살표로 옮겨 다닐 수 있고
 * 스크린 리더가 '5개 중 3번째'까지 읽어준다. 버튼으로 만들면 둘 다 직접 짜야 한다.
 * 라디오는 화면에서 감추고 <label>의 별 글자만 보여준다.
 */
export default function StarRating({ value, onChange, label, size = 'small' }: StarRatingProps) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('flex gap-1', sizeStyles[size])}>
      {/*
        label의 relative를 빼면 안 된다 — sr-only(position:absolute)로 감춘 라디오의
        기준이 바깥의 위치 지정 조상(<dialog>)이 되어, 포커스가 갈 때 브라우저가
        그쪽으로 스크롤을 옮겨 화면이 튄다.
      */}
      {STARS.map((star) => (
        <label key={star} className="relative cursor-pointer">
          <input
            type="radio"
            name={`${label}-rating`}
            checked={value === star}
            onChange={() => onChange(star)}
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className={cn(
              'peer-focus-visible:outline-inverse block leading-none peer-focus-visible:outline-2',
              // border-strong은 text-primary와 같은 #1c1b18이라 빈 별이 구분되지 않는다.
              star <= value ? 'text-text-primary' : 'text-border-default',
            )}
          >
            ★
          </span>
          <span className="sr-only">{star}점</span>
        </label>
      ))}
    </div>
  )
}
