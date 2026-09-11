import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ApiError } from '@/api/ApiError'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import Input from '@/components/ui/Input'
import { checkNickname, signup } from '@/features/auth/api/auth'
import AuthLayout from '@/features/auth/components/AuthLayout'
import FormAlert from '@/features/auth/components/FormAlert'
import { AUTH_IMAGES } from '@/features/auth/constants'
import {
  formatPhone,
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
  PASSWORD_MIN_LENGTH,
  validateBirthDate,
  validateEmail,
  validateName,
  validateNickname,
  validatePassword,
  validatePasswordConfirm,
  validatePhone,
} from '@/features/auth/utils/validation'

type Form = {
  email: string
  password: string
  passwordConfirm: string
  name: string
  birthDate: string
  phone: string
  nickname: string
}

type Errors = Partial<Record<keyof Form, string>>

const INITIAL_FORM: Form = {
  email: '',
  password: '',
  passwordConfirm: '',
  name: '',
  birthDate: '',
  phone: '',
  nickname: '',
}

/** 이용약관·개인정보는 필수, 매거진 수신은 선택. */
type Agreements = {
  terms: boolean
  privacy: boolean
  marketing: boolean
}

export default function SignupPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState<Form>(INITIAL_FORM)
  const [agreements, setAgreements] = useState<Agreements>({
    terms: false,
    privacy: false,
    marketing: false,
  })

  const [errors, setErrors] = useState<Errors>({})
  const [agreementError, setAgreementError] = useState<string>()
  const [submitError, setSubmitError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)

  /** null=미확인. 닉네임을 고치면 null로 돌아간다. */
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null)
  const [checkingNickname, setCheckingNickname] = useState(false)

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
    if (key === 'nickname') setNicknameAvailable(null)
  }

  /**
   * 제출 때 몰아서 보여주면 한 번에 일곱 개가 뜬다. 칸을 벗어날 때 그 칸만 검증한다.
   * 빈 칸은 아직 안 채운 것뿐이므로 넘어간다 — 최종 검증은 handleSubmit이 한다.
   */
  function validateField<K extends keyof Form>(key: K) {
    if (!form[key]) return
    const validators: Record<keyof Form, () => string | undefined> = {
      email: () => validateEmail(form.email),
      password: () => validatePassword(form.password),
      passwordConfirm: () => validatePasswordConfirm(form.passwordConfirm, form.password),
      name: () => validateName(form.name),
      birthDate: () => validateBirthDate(form.birthDate),
      phone: () => validatePhone(form.phone),
      nickname: () => validateNickname(form.nickname),
    }
    setErrors((prev) => ({ ...prev, [key]: validators[key]() }))
  }

  async function handleNicknameCheck() {
    const error = validateNickname(form.nickname)
    if (error) {
      setErrors((prev) => ({ ...prev, nickname: error }))
      return
    }

    setCheckingNickname(true)
    try {
      const { available } = await checkNickname(form.nickname.trim())
      setNicknameAvailable(available)
      setErrors((prev) => ({
        ...prev,
        nickname: available ? undefined : '이미 사용 중인 닉네임입니다. 다른 이름을 입력해주세요.',
      }))
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        nickname: error instanceof ApiError ? error.message : '중복 확인에 실패했습니다.',
      }))
    } finally {
      setCheckingNickname(false)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const nextErrors: Errors = {
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      passwordConfirm: validatePasswordConfirm(form.passwordConfirm, form.password),
      name: validateName(form.name),
      birthDate: validateBirthDate(form.birthDate),
      phone: validatePhone(form.phone),
      nickname: validateNickname(form.nickname),
    }

    if (!nextErrors.nickname && nicknameAvailable !== true) {
      nextErrors.nickname = '닉네임 중복 확인을 해주세요.'
    }

    const nextAgreementError =
      agreements.terms && agreements.privacy ? undefined : '필수 약관에 동의해주세요.'

    setErrors(nextErrors)
    setAgreementError(nextAgreementError)
    setSubmitError(undefined)

    if (Object.values(nextErrors).some(Boolean) || nextAgreementError) return

    setSubmitting(true)
    try {
      const { user } = await signup({
        email: form.email,
        password: form.password,
        name: form.name.trim(),
        birthDate: form.birthDate,
        phone: form.phone.replace(/\D/g, ''),
        nickname: form.nickname.trim(),
        marketingAgreed: agreements.marketing,
      })
      navigate('/signup/done', { replace: true, state: { nickname: user.nickname } })
    } catch (error) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : '가입에 실패했습니다. 잠시 후 다시 시도해주세요.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      image={AUTH_IMAGES.signup.src}
      imageRatio={AUTH_IMAGES.signup.ratio}
      headline={['가입하고', '기록을 남겨요']}
      caption={[
        '다녀온 온천이 내 지도에 채워집니다',
        '가고 싶은 곳을 찜해두고 팜플렛으로 만들어요',
      ]}
    >
      <h1 className="text-[32px] leading-[1.2] font-bold tracking-[-0.02em] sm:text-[36px]">
        회원가입
      </h1>
      <p className="text-text-secondary mt-2.5 text-[14px] leading-[1.6]">
        세 가지만 입력하면 끝나요. 약 1분 걸립니다.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-9 flex flex-col gap-9">
        <Section title="로그인 정보">
          <Input
            label="이메일"
            required
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            onBlur={() => validateField('email')}
            error={errors.email}
            disabled={submitting}
          />
          <Input
            label="비밀번호"
            required
            type="password"
            autoComplete="new-password"
            placeholder="비밀번호"
            // 조건은 틀린 뒤가 아니라 입력 전에 알려준다.
            hint={`${PASSWORD_MIN_LENGTH}자 이상`}
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            onBlur={() => validateField('password')}
            error={errors.password}
            disabled={submitting}
          />
          <Input
            label="비밀번호 확인"
            required
            type="password"
            autoComplete="new-password"
            placeholder="다시 입력"
            value={form.passwordConfirm}
            onChange={(e) => update('passwordConfirm', e.target.value)}
            onBlur={() => validateField('passwordConfirm')}
            error={errors.passwordConfirm}
            disabled={submitting}
          />
        </Section>

        <Section title="본인 정보">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="이름"
              required
              autoComplete="name"
              placeholder="실명을 입력하세요"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              onBlur={() => validateField('name')}
              error={errors.name}
              disabled={submitting}
            />
            <Input
              label="생년월일"
              required
              type="date"
              autoComplete="bday"
              value={form.birthDate}
              onChange={(e) => update('birthDate', e.target.value)}
              onBlur={() => validateField('birthDate')}
              error={errors.birthDate}
              disabled={submitting}
            />
          </div>
          <Input
            label="전화번호"
            required
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="010-1234-5678"
            value={form.phone}
            onChange={(e) => update('phone', formatPhone(e.target.value))}
            onBlur={() => validateField('phone')}
            error={errors.phone}
            disabled={submitting}
          />
        </Section>

        <Section title="프로필">
          <Input
            label="닉네임"
            required
            placeholder="리뷰에 표시됩니다"
            hint={`${NICKNAME_MIN_LENGTH}~${NICKNAME_MAX_LENGTH}자`}
            value={form.nickname}
            onChange={(e) => update('nickname', e.target.value)}
            onBlur={() => validateField('nickname')}
            error={errors.nickname}
            success={nicknameAvailable ? '사용할 수 있는 닉네임입니다.' : undefined}
            disabled={submitting}
            trailing={{
              label: checkingNickname ? '확인 중' : '중복 확인',
              onClick: handleNicknameCheck,
              disabled: checkingNickname || submitting,
            }}
          />
        </Section>

        <Section title="약관 동의">
          <div className="flex flex-col gap-3">
            <AgreementRow
              label="이용약관 동의 (필수)"
              checked={agreements.terms}
              disabled={submitting}
              onChange={(checked) => {
                setAgreements((prev) => ({ ...prev, terms: checked }))
                setAgreementError(undefined)
              }}
              to="/terms"
            />
            <AgreementRow
              label="개인정보 처리방침 동의 (필수)"
              checked={agreements.privacy}
              disabled={submitting}
              onChange={(checked) => {
                setAgreements((prev) => ({ ...prev, privacy: checked }))
                setAgreementError(undefined)
              }}
              to="/privacy"
            />
            <AgreementRow
              label="매거진 소식 받기 (선택)"
              checked={agreements.marketing}
              disabled={submitting}
              onChange={(checked) => setAgreements((prev) => ({ ...prev, marketing: checked }))}
            />
            {agreementError && (
              <p role="alert" className="text-danger text-[12px]">
                {agreementError}
              </p>
            )}
          </div>
        </Section>

        {submitError && <FormAlert>{submitError}</FormAlert>}

        <Button type="submit" size="large" loading={submitting} className="w-full">
          {submitting ? '가입 중' : '회원가입'}
        </Button>
      </form>

      <p className="text-text-secondary mt-8 text-center text-[13px]">
        이미 계정이 있나요?{' '}
        <Link
          to="/login"
          className="text-text-primary focus-visible:ring-border-strong rounded-[4px] font-semibold underline-offset-4 outline-none hover:underline focus-visible:ring-2"
        >
          로그인
        </Link>
      </p>
    </AuthLayout>
  )
}

/** 입력이 많아 보이지 않도록 관련된 칸끼리 묶는다. 구분은 테두리가 아니라 여백과 라벨로. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-5">
      <legend className="text-text-primary mb-5 text-[13px] font-semibold">{title}</legend>
      {children}
    </fieldset>
  )
}

function AgreementRow({
  label,
  checked,
  onChange,
  disabled,
  to,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  to?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Checkbox
        label={label}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      {to && (
        <Link
          to={to}
          className="text-text-secondary hover:text-text-primary focus-visible:ring-border-strong shrink-0 rounded-[4px] px-1 py-1 text-[12px] underline-offset-2 outline-none hover:underline focus-visible:ring-2"
        >
          보기
        </Link>
      )}
    </div>
  )
}
