import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ApiError } from '@/api/ApiError'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import Input from '@/components/ui/Input'
import { checkNickname, signup } from '@/features/auth/api/auth'
import AuthLayout from '@/features/auth/components/AuthLayout'
import { AUTH_IMAGES } from '@/features/auth/constants'
import {
  formatPhone,
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
        nickname: available ? undefined : '이미 사용 중인 닉네임입니다.',
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
      <h1 className="text-[32px] leading-tight font-bold sm:text-[40px]">회원가입</h1>

      <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-5">
        <Input
          label="이메일"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          error={errors.email}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="비밀번호"
            type="password"
            autoComplete="new-password"
            placeholder={`${PASSWORD_MIN_LENGTH}자 이상`}
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            error={errors.password}
          />
          <Input
            label="비밀번호 확인"
            type="password"
            autoComplete="new-password"
            placeholder="다시 입력"
            value={form.passwordConfirm}
            onChange={(e) => update('passwordConfirm', e.target.value)}
            error={errors.passwordConfirm}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="이름"
            autoComplete="name"
            placeholder="실명을 입력하세요"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            error={errors.name}
          />
          <Input
            label="생년월일"
            type="date"
            autoComplete="bday"
            value={form.birthDate}
            onChange={(e) => update('birthDate', e.target.value)}
            error={errors.birthDate}
          />
        </div>

        <Input
          label="전화번호"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="010-1234-5678"
          value={form.phone}
          onChange={(e) => update('phone', formatPhone(e.target.value))}
          error={errors.phone}
        />

        <Input
          label="닉네임"
          placeholder="리뷰에 표시됩니다"
          value={form.nickname}
          onChange={(e) => update('nickname', e.target.value)}
          error={errors.nickname}
          hint={nicknameAvailable ? '사용할 수 있는 닉네임입니다.' : undefined}
          trailing={{
            label: checkingNickname ? '확인 중' : '중복 확인',
            onClick: handleNicknameCheck,
            disabled: checkingNickname,
          }}
        />

        <div className="flex flex-col gap-2.5">
          <AgreementRow
            label="이용약관 동의 (필수)"
            checked={agreements.terms}
            onChange={(checked) => {
              setAgreements((prev) => ({ ...prev, terms: checked }))
              setAgreementError(undefined)
            }}
            to="/terms"
          />
          <AgreementRow
            label="개인정보 처리방침 동의 (필수)"
            checked={agreements.privacy}
            onChange={(checked) => {
              setAgreements((prev) => ({ ...prev, privacy: checked }))
              setAgreementError(undefined)
            }}
            to="/privacy"
          />
          <AgreementRow
            label="매거진 소식 받기 (선택)"
            checked={agreements.marketing}
            onChange={(checked) => setAgreements((prev) => ({ ...prev, marketing: checked }))}
          />
          {agreementError && (
            <p role="alert" className="text-danger text-[12px]">
              {agreementError}
            </p>
          )}
        </div>

        {submitError && (
          <p role="alert" className="text-danger text-[13px]">
            {submitError}
          </p>
        )}

        <Button type="submit" size="large" disabled={submitting} className="mt-2 w-full">
          {submitting ? '가입 중' : '회원가입'}
        </Button>
      </form>

      <p className="text-text-secondary mt-5 text-center text-[13px]">
        이미 계정이 있나요?{' '}
        <Link to="/login" className="text-text-primary font-bold">
          로그인
        </Link>
      </p>
    </AuthLayout>
  )
}

function AgreementRow({
  label,
  checked,
  onChange,
  to,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  to?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Checkbox label={label} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {to && (
        <Link
          to={to}
          className="text-text-secondary hover:text-text-primary shrink-0 text-[12px] underline-offset-2 hover:underline"
        >
          보기
        </Link>
      )}
    </div>
  )
}
