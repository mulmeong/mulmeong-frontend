import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ApiError } from '@/api/ApiError'
import Checkbox from '@/components/ui/Checkbox'
import { checkEmail, checkNickname, signup } from '@/features/auth/api/auth'
import { AuthField, AuthHeading, AuthSubmit } from '@/features/auth/components/AuthForm'
import AuthLayout from '@/features/auth/components/AuthLayout'
import { AUTH_IMAGES } from '@/features/auth/constants'
import {
  formatPhone,
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
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
  nickname: string
  birthDate: string
  phone: string
}

type Errors = Partial<Record<keyof Form, string>>

/** 서버에 중복 여부를 물어보는 필드. */
type CheckedField = 'email' | 'nickname'

const PASSWORD_HINT = '영문·숫자 포함 8자 이상'

const FIELD_LAYOUT = [
  '[&>div]:min-h-11 [&>div>input]:h-11',
  '[&>label]:text-[14px] [&>label]:leading-5 [&>label]:font-medium',
  '[&_input]:text-[16px] [&_input]:leading-6 [&_input]:font-normal',
  '[&_input::placeholder]:text-[15px] [&_input::placeholder]:font-normal',
  '[&>p]:text-[12px] [&>label>span]:text-[12px]',
].join(' ')

function validateField(field: keyof Form, values: Form): string | undefined {
  switch (field) {
    case 'email':
      return validateEmail(values.email)
    case 'password':
      return validatePassword(values.password)
        ? values.password.length > PASSWORD_MAX_LENGTH
          ? validatePassword(values.password)
          : `${PASSWORD_HINT} 입력해주세요.`
        : undefined
    case 'passwordConfirm':
      return validatePasswordConfirm(values.passwordConfirm, values.password)
    case 'name':
      return validateName(values.name)
    case 'nickname':
      return validateNickname(values.nickname)
    case 'birthDate': {
      const error = validateBirthDate(values.birthDate)
      if (error) return error
      return new Date(values.birthDate).toISOString().slice(0, 10) === values.birthDate
        ? undefined
        : '존재하지 않는 날짜입니다.'
    }
    case 'phone':
      return validatePhone(values.phone)
  }
}

const INITIAL_FORM: Form = {
  email: '',
  password: '',
  passwordConfirm: '',
  name: '',
  nickname: '',
  birthDate: '',
  phone: '',
}

/**
 * 이용약관·개인정보는 필수, 매거진 수신은 선택.
 * 셋 다 서버로 보내지 않는다 — 가입 API(SignupRequest)에 해당 필드가 없다.
 * 수신 동의를 저장해야 하면 BE에 필드 추가 요청이 필요하다.
 */
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
  const touched = useRef<Partial<Record<keyof Form, boolean>>>({})
  const availabilityVersion = useRef({ email: 0, nickname: 0 })

  /** null=미확인. 값을 고치면 null로 돌아간다. */
  const [available, setAvailable] = useState<{ email: boolean | null; nickname: boolean | null }>({
    email: null,
    nickname: null,
  })

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    const nextForm = { ...form, [key]: value }
    setForm(nextForm)
    setErrors((prev) => ({
      ...prev,
      [key]: touched.current[key] ? validateField(key, nextForm) : undefined,
      ...(key === 'password' && touched.current.passwordConfirm
        ? { passwordConfirm: validateField('passwordConfirm', nextForm) }
        : {}),
    }))
    setSubmitError(undefined)
    // 제네릭 K는 비교만으로 좁혀지지 않아 별도 변수로 받는다.
    const checked: CheckedField | undefined =
      key === 'email' || key === 'nickname' ? key : undefined
    if (checked) {
      availabilityVersion.current[checked] += 1
      setAvailable((prev) => ({ ...prev, [checked]: null }))
    }
  }

  function handleBlur(field: keyof Form) {
    touched.current[field] = true
    setErrors((prev) => ({ ...prev, [field]: validateField(field, form) }))
    if (field === 'email' || field === 'nickname') void checkAvailability(field)
  }

  function updateAgreement(field: keyof Agreements, checked: boolean) {
    const next = { ...agreements, [field]: checked }
    setAgreements(next)
    if (agreementError) {
      setAgreementError(next.terms && next.privacy ? undefined : '필수 약관에 동의해주세요.')
    }
  }

  /**
   * AUTH-07 중복 확인. 명세대로 blur 시점에 부른다.
   * UX 보조일 뿐이라 실패하거나 서버에 없으면 조용히 넘어간다 — 최종 판정은 가입 API의 409다.
   *
   * 이메일은 서버 엔드포인트가 아직 없어 실서버에서는 undefined가 온다 (auth.ts 주석 참고).
   */
  async function checkAvailability(field: 'email' | 'nickname') {
    const version = ++availabilityVersion.current[field]
    const value = form[field].trim()
    const invalid = field === 'email' ? validateEmail(value) : validateNickname(value)
    if (!value || invalid) return

    try {
      const result = field === 'email' ? await checkEmail(value) : await checkNickname(value)
      if (!result || version !== availabilityVersion.current[field]) return
      setAvailable((prev) => ({ ...prev, [field]: result.available }))
      if (!result.available) {
        setErrors((prev) => ({
          ...prev,
          [field]: field === 'email' ? '이미 가입된 이메일입니다.' : '이미 사용 중인 닉네임입니다.',
        }))
      }
    } catch {
      if (version === availabilityVersion.current[field]) {
        setAvailable((prev) => ({ ...prev, [field]: null }))
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    for (const field of Object.keys(form) as (keyof Form)[]) touched.current[field] = true

    const nextErrors: Errors = {
      email: validateEmail(form.email),
      password: validateField('password', form),
      passwordConfirm: validatePasswordConfirm(form.passwordConfirm, form.password),
      name: validateName(form.name),
      birthDate: validateField('birthDate', form),
      nickname: validateNickname(form.nickname),
      phone: validatePhone(form.phone),
    }

    // 중복이 확인된 값이면 제출 전에 잡는다 (미확인은 서버가 판단).
    if (!nextErrors.email && available.email === false) {
      nextErrors.email = '이미 가입된 이메일입니다.'
    }
    if (!nextErrors.nickname && available.nickname === false) {
      nextErrors.nickname = '이미 사용 중인 닉네임입니다.'
    }

    const nextAgreementError =
      agreements.terms && agreements.privacy ? undefined : '필수 약관에 동의해주세요.'

    setErrors(nextErrors)
    setAgreementError(nextAgreementError)
    setSubmitError(undefined)

    const firstInvalid = (Object.keys(nextErrors) as (keyof Form)[]).find(
      (field) => nextErrors[field],
    )
    if (firstInvalid || nextAgreementError) {
      const name = firstInvalid ?? (agreements.terms ? 'privacy' : 'terms')
      event.currentTarget.querySelector<HTMLInputElement>(`[name="${name}"]`)?.focus()
      return
    }

    setSubmitting(true)
    try {
      // 자동 로그인은 하지 않는다 — 가입 후 사용자가 직접 로그인한다 (AUTH-07).
      const { nickname, email } = await signup({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        passwordConfirm: form.passwordConfirm,
        name: form.name.trim(),
        nickname: form.nickname.trim(),
        birthDate: form.birthDate,
        phone: formatPhone(form.phone),
      })
      // 완료 화면이 로그인으로 넘길 때 이메일을 채워 다시 입력하지 않게 한다.
      // 서버가 돌려준 값을 쓴다 — 소문자 정규화가 이미 적용돼 있다.
      navigate('/signup/done', { replace: true, state: { nickname, email } })
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
      formPage
      panelClassName="lg:px-4 lg:py-12 xl:px-6"
      contentClassName="relative top-6 [&>p:first-of-type]:mt-3"
      image={AUTH_IMAGES.signup.src}
      imageRatio={AUTH_IMAGES.signup.ratio}
      headline={['가입하고', '기록을 남겨요']}
      caption={[
        '다녀온 온천이 내 지도에 채워집니다',
        '가고 싶은 곳을 찜해두고 팜플렛으로 만들어요',
      ]}
    >
      <AuthHeading
        title="회원가입"
        subtitle="가고 싶은 온천을 저장하고, 나만의 여행을 기록하세요."
      />

      <form
        onSubmit={handleSubmit}
        noValidate
        aria-busy={submitting}
        className="mt-9 flex flex-col gap-6 sm:mt-10"
      >
        <div className="flex flex-col gap-6">
          <AuthField
            compact
            className={FIELD_LAYOUT}
            label="이메일"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            error={errors.email}
          />

          <div className="grid items-start gap-x-5 gap-y-6 md:grid-cols-2">
            <AuthField
              compact
              className={`${FIELD_LAYOUT} [&>p]:break-keep`}
              label="비밀번호"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="비밀번호 입력"
              maxLength={PASSWORD_MAX_LENGTH}
              required
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              onBlur={() => handleBlur('password')}
              error={errors.password}
              hint={PASSWORD_HINT}
            />
            <AuthField
              compact
              className={`${FIELD_LAYOUT} [&>p]:break-keep`}
              label="비밀번호 확인"
              reserveMessageSpace
              name="passwordConfirm"
              type="password"
              autoComplete="new-password"
              placeholder="비밀번호 다시 입력"
              maxLength={PASSWORD_MAX_LENGTH}
              required
              value={form.passwordConfirm}
              onChange={(e) => update('passwordConfirm', e.target.value)}
              onBlur={() => handleBlur('passwordConfirm')}
              error={errors.passwordConfirm}
            />
          </div>

          <div className="grid items-start gap-x-5 gap-y-6 md:grid-cols-2">
            <AuthField
              compact
              className={FIELD_LAYOUT}
              label="이름"
              name="name"
              autoComplete="name"
              placeholder="이름 입력"
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              error={errors.name}
            />
            <AuthField
              compact
              className={FIELD_LAYOUT}
              label="생년월일"
              reserveMessageSpace
              name="birthDate"
              inputMode="numeric"
              autoComplete="bday"
              placeholder="YYYY.MM.DD"
              maxLength={10}
              required
              value={form.birthDate.replace(/-/g, '.')}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 8)
                update(
                  'birthDate',
                  [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8)]
                    .filter(Boolean)
                    .join('-'),
                )
              }}
              onBlur={() => handleBlur('birthDate')}
              error={errors.birthDate}
              trailing={
                <span className="text-text-primary/60 relative flex size-11 items-center justify-center rounded-sm focus-within:ring-2 focus-within:ring-border-strong">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className="size-5"
                  >
                    <rect x="4" y="5" width="16" height="16" rx="2" />
                    <path d="M8 3v4M16 3v4M4 10h16M8 14h2M14 14h2M8 17h2" />
                  </svg>
                  <input
                    type="date"
                    aria-label="생년월일 달력에서 선택"
                    value={/^\d{4}-\d{2}-\d{2}$/.test(form.birthDate) ? form.birthDate : ''}
                    onChange={(e) => update('birthDate', e.target.value)}
                    onBlur={() => handleBlur('birthDate')}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                  />
                </span>
              }
            />
          </div>

          <AuthField
            compact
            className={FIELD_LAYOUT}
            label="닉네임"
            labelHint={`${NICKNAME_MIN_LENGTH}~${NICKNAME_MAX_LENGTH}자`}
            reserveMessageSpace
            name="nickname"
            autoComplete="nickname"
            placeholder="닉네임 입력"
            required
            value={form.nickname}
            onChange={(e) => update('nickname', e.target.value)}
            onBlur={() => handleBlur('nickname')}
            error={errors.nickname}
          />

          <AuthField
            compact
            className={FIELD_LAYOUT}
            label="전화번호"
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="010-1234-5678"
            required
            value={form.phone}
            onChange={(e) => update('phone', formatPhone(e.target.value))}
            onBlur={() => handleBlur('phone')}
            error={errors.phone}
          />
        </div>

        <fieldset className="border-border-default/60 flex min-w-0 flex-col gap-1 border-t pt-4">
          <legend className="sr-only">약관 동의</legend>
          <AgreementRow
            label="이용약관 동의"
            name="terms"
            required
            invalid={Boolean(agreementError) && !agreements.terms}
            checked={agreements.terms}
            onChange={(checked) => updateAgreement('terms', checked)}
          />
          <AgreementRow
            label="개인정보 처리방침 동의"
            name="privacy"
            required
            invalid={Boolean(agreementError) && !agreements.privacy}
            checked={agreements.privacy}
            onChange={(checked) => updateAgreement('privacy', checked)}
            to="/privacy"
          />
          <AgreementRow
            label="매거진 소식 받기"
            name="marketing"
            checked={agreements.marketing}
            onChange={(checked) => updateAgreement('marketing', checked)}
          />
          {agreementError && (
            <p
              id="signup-agreement-error"
              role="alert"
              className="text-danger mt-1 text-[12px] leading-5"
            >
              {agreementError}
            </p>
          )}
        </fieldset>

        {submitError && (
          <p role="alert" className="text-danger text-[13px]">
            {submitError}
          </p>
        )}

        <AuthSubmit disabled={submitting}>{submitting ? '가입 중…' : '회원가입'}</AuthSubmit>
      </form>

      <p className="text-text-primary/65 mt-6 text-center text-[13px] leading-6">
        이미 계정이 있나요?{' '}
        <Link
          to="/login"
          className="text-text-primary ml-1 inline-flex min-h-11 items-center font-semibold underline-offset-4 hover:underline focus-visible:underline lg:min-h-8"
        >
          로그인
        </Link>
      </p>
    </AuthLayout>
  )
}

function AgreementRow({
  label,
  name,
  required = false,
  invalid = false,
  checked,
  onChange,
  to,
}: {
  label: string
  name: string
  required?: boolean
  invalid?: boolean
  checked: boolean
  onChange: (checked: boolean) => void
  to?: string
}) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 lg:min-h-9">
      <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-2.5 lg:min-h-9">
        <Checkbox
          name={name}
          required={required}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? 'signup-agreement-error' : undefined}
          className="outline-none focus-visible:ring-2 focus-visible:ring-border-strong focus-visible:ring-offset-2 aria-invalid:border-danger"
        />
        <span className="text-text-primary text-[13px] leading-5">
          {label}{' '}
          <span className="text-text-primary/60 ml-1 inline-block text-[11px]">
            ({required ? '필수' : '선택'})
          </span>
        </span>
      </label>
      {to && (
        <Link
          to={to}
          aria-label={`${label} 내용 보기`}
          className="text-text-primary/65 hover:text-text-primary inline-flex min-h-11 min-w-9 shrink-0 items-center justify-end text-[12px] underline-offset-4 hover:underline focus-visible:underline lg:min-h-9"
        >
          보기
        </Link>
      )}
    </div>
  )
}
