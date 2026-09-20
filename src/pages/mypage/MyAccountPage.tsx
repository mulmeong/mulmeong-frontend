import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'

import { ApiError } from '@/api'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { checkNickname } from '@/features/auth/api/auth'
import { AuthField } from '@/features/auth/components/AuthForm'
import { useAuth } from '@/features/auth/hooks/authContext'
import {
  validateNickname,
  validatePassword,
  validatePasswordConfirm,
} from '@/features/auth/utils/validation'
import { updateMe, withdraw } from '@/features/mypage/api/account'
import type { MyPageOutletContext } from '@/features/mypage/components/MyPageLayout'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-2 sm:grid sm:grid-cols-[124px_minmax(0,1fr)] sm:gap-x-5">
      <span className="text-text-primary/65 text-[13px] leading-6 sm:pt-0.5">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-7 sm:mt-8">
      <h2 className="text-text-primary border-border-default border-b pb-2 text-[17px] leading-6 font-semibold">
        {title}
      </h2>
      <div className="pt-0.5">{children}</div>
    </section>
  )
}

type PasswordErrors = {
  currentPassword?: string
  newPassword?: string
  newPasswordConfirm?: string
  form?: string
}

function passwordErrorsFromServer(error: unknown): PasswordErrors {
  if (!(error instanceof ApiError)) return { form: '비밀번호를 변경하지 못했어요.' }
  const data = error.data
  if (typeof data === 'object' && data !== null) {
    if ('code' in data && data.code === 'CURRENT_PASSWORD_MISMATCH') {
      return { currentPassword: error.message }
    }
    if ('code' in data && data.code === 'PASSWORD_MISMATCH') {
      return { newPasswordConfirm: error.message }
    }
    if ('fieldErrors' in data && Array.isArray(data.fieldErrors)) {
      const errors: PasswordErrors = {}
      for (const detail of data.fieldErrors as unknown[]) {
        if (
          typeof detail !== 'object' ||
          detail === null ||
          !('field' in detail) ||
          !('reason' in detail)
        )
          continue
        const { field, reason } = detail
        if (
          (field === 'currentPassword' ||
            field === 'newPassword' ||
            field === 'newPasswordConfirm') &&
          typeof reason === 'string'
        ) {
          errors[field] = reason
        }
      }
      if (Object.keys(errors).length) return errors
    }
  }
  return { form: error.message }
}

export default function MyAccountPage() {
  const { profile, profileError, reloadProfile } = useOutletContext<MyPageOutletContext>()
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [editingNickname, setEditingNickname] = useState(false)
  const [nickname, setNickname] = useState('')
  const [nicknameError, setNicknameError] = useState<string>()
  const [nicknameHint, setNicknameHint] = useState<string>()
  const [checkedNickname, setCheckedNickname] = useState<string>()
  const [checkingNickname, setCheckingNickname] = useState(false)
  const [savingNickname, setSavingNickname] = useState(false)

  const [passwordOpen, setPasswordOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({})
  const [savingPassword, setSavingPassword] = useState(false)
  const passwordSession = useRef(0)

  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawPassword, setWithdrawPassword] = useState('')
  const [withdrawError, setWithdrawError] = useState<string>()
  const [withdrawing, setWithdrawing] = useState(false)
  const withdrawSession = useRef(0)
  const [successMessage, setSuccessMessage] = useState<string>()

  function startEditing() {
    setNickname(profile?.nickname ?? '')
    setNicknameError(undefined)
    setNicknameHint(undefined)
    setCheckedNickname(undefined)
    setEditingNickname(true)
  }

  async function handleCheckNickname() {
    if (checkingNickname || savingNickname) return
    const value = nickname.trim()
    const invalid = validateNickname(value)
    setNicknameError(invalid)
    setNicknameHint(undefined)
    setCheckedNickname(undefined)
    if (invalid) return
    if (value === profile?.nickname) {
      setNicknameHint('지금 쓰고 있는 닉네임이에요.')
      return
    }
    setCheckingNickname(true)
    try {
      const { available } = await checkNickname(value, true)
      setNicknameError(available ? undefined : '이미 사용 중인 닉네임입니다.')
      setNicknameHint(available ? '사용할 수 있어요.' : undefined)
      setCheckedNickname(available ? value : undefined)
    } catch (error) {
      setNicknameError(error instanceof ApiError ? error.message : '중복 확인을 하지 못했어요.')
    } finally {
      setCheckingNickname(false)
    }
  }

  async function handleSaveNickname(event: FormEvent) {
    event.preventDefault()
    if (savingNickname || checkingNickname || !profile) return
    const value = nickname.trim()
    if (value === profile.nickname) {
      setEditingNickname(false)
      return
    }
    const invalid = validateNickname(value)
    if (invalid || checkedNickname !== value) {
      setNicknameError(invalid ?? '닉네임 중복 확인을 해주세요.')
      return
    }
    setSavingNickname(true)
    try {
      await updateMe({ nickname: value })
      setEditingNickname(false)
      setNicknameHint(undefined)
      reloadProfile()
      setSuccessMessage('닉네임을 변경했어요.')
    } catch (error) {
      setNicknameError(error instanceof ApiError ? error.message : '닉네임을 변경하지 못했어요.')
    } finally {
      setSavingNickname(false)
    }
  }

  function closePassword() {
    passwordSession.current += 1
    setPasswordOpen(false)
    setCurrentPassword('')
    setNewPassword('')
    setNewPasswordConfirm('')
    setPasswordErrors({})
  }

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault()
    if (savingPassword) return
    const errors: PasswordErrors = {
      currentPassword: currentPassword ? undefined : '현재 비밀번호를 입력해주세요.',
      newPassword: validatePassword(newPassword),
      newPasswordConfirm: validatePasswordConfirm(newPasswordConfirm, newPassword),
    }
    setPasswordErrors(errors)
    if (Object.values(errors).some(Boolean)) return

    const session = passwordSession.current
    setSavingPassword(true)
    try {
      // UpdateMeRequest는 확인 값도 요구한다. 동일 비밀번호는 기존 서버 정책에 맡긴다.
      await updateMe({ currentPassword, newPassword, newPasswordConfirm })
      if (session !== passwordSession.current) return
      closePassword()
      setSuccessMessage('비밀번호를 변경했어요.')
    } catch (error) {
      if (session === passwordSession.current) setPasswordErrors(passwordErrorsFromServer(error))
    } finally {
      setSavingPassword(false)
    }
  }

  function closeWithdraw() {
    withdrawSession.current += 1
    setWithdrawOpen(false)
    setWithdrawPassword('')
    setWithdrawError(undefined)
  }

  async function handleWithdraw(event: FormEvent) {
    event.preventDefault()
    if (withdrawing) return
    if (!withdrawPassword) {
      setWithdrawError('비밀번호를 입력해주세요.')
      return
    }
    const session = withdrawSession.current
    setWithdrawing(true)
    try {
      await withdraw(withdrawPassword)
      closeWithdraw()
      await logout()
      void navigate('/', { replace: true })
    } catch (error) {
      if (session === withdrawSession.current) {
        setWithdrawError(error instanceof ApiError ? error.message : '탈퇴하지 못했어요.')
      }
    } finally {
      setWithdrawing(false)
    }
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-[600px] py-6">
        {profileError ? (
          <>
            <p role="alert" className="text-danger mb-4 text-[13px]">
              {profileError}
            </p>
            <Button hierarchy="secondary" onClick={reloadProfile}>
              다시 시도
            </Button>
          </>
        ) : (
          <p role="status" className="text-text-secondary text-[14px]">
            내 정보를 불러오는 중…
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[600px] pt-3 pb-10 sm:pt-4">
      <h1 className="text-text-primary text-[26px] leading-tight font-semibold sm:text-[28px]">
        내 정보
      </h1>
      <p className="text-text-primary/65 mt-1 text-[13px] leading-5">
        프로필과 계정 정보를 관리할 수 있어요.
      </p>
      <Section title="프로필">
        <Row label="닉네임">
          {editingNickname ? (
            <form
              onSubmit={handleSaveNickname}
              noValidate
              aria-busy={savingNickname || checkingNickname}
            >
              <div className="flex flex-wrap items-start gap-2">
                <div className="min-w-0 basis-full sm:flex-1 sm:basis-36">
                  <AuthField
                    compact
                    aria-label="닉네임"
                    autoFocus
                    value={nickname}
                    disabled={savingNickname || checkingNickname}
                    onChange={(event) => {
                      setNickname(event.target.value)
                      setNicknameError(undefined)
                      setNicknameHint(undefined)
                      setCheckedNickname(undefined)
                    }}
                    error={nicknameError}
                    hint={nicknameHint}
                  />
                </div>
                <Button
                  hierarchy="secondary"
                  onClick={handleCheckNickname}
                  disabled={checkingNickname || savingNickname}
                >
                  {checkingNickname ? '확인 중…' : '중복 확인'}
                </Button>
                <Button type="submit" disabled={savingNickname || checkingNickname}>
                  {savingNickname ? '저장 중…' : '저장'}
                </Button>
                <button
                  type="button"
                  onClick={() => setEditingNickname(false)}
                  disabled={savingNickname || checkingNickname}
                  className="text-text-primary/65 hover:text-text-primary min-h-11 px-2 text-[14px] underline underline-offset-4 disabled:opacity-40"
                >
                  취소
                </button>
              </div>
            </form>
          ) : (
            <div className="flex min-h-8 items-center gap-7">
              <span className="text-text-primary min-w-0 text-[16px] leading-6 font-medium break-all">
                {profile.nickname}
              </span>
              <button
                type="button"
                onClick={startEditing}
                disabled={!profile.nicknameEditable}
                title={
                  !profile.nicknameEditable
                    ? '닉네임은 한 달에 한 번만 변경할 수 있어요.'
                    : undefined
                }
                className="text-text-primary/70 hover:text-text-primary min-h-8 shrink-0 px-1 text-[13px] underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-45"
              >
                수정
              </button>
            </div>
          )}
          <p className="text-text-primary/60 mt-0.5 text-[12px] leading-5">
            닉네임은 한 달에 한 번만 변경할 수 있어요.
          </p>
        </Row>
      </Section>

      <Section title="온천 활동">
        <Row label="레벨">
          <div className="flex min-h-8 flex-wrap items-center gap-x-2 gap-y-1 text-[16px] leading-6">
            <span className="font-semibold">LV.{profile.level}</span>
            <span aria-hidden="true" className="text-text-primary/40">
              ·
            </span>
            <span className="font-medium">{profile.title}</span>
          </div>
        </Row>
        <Row label="방문 인증">
          <span className="block py-0.5 text-[15px] leading-6 font-medium">
            {profile.visitedOnsenCount}곳
          </span>
        </Row>
      </Section>

      <Section title="계정">
        <Row label="이메일">
          <span className="block py-0.5 text-[15px] leading-6 font-medium break-all">
            {profile.email}
          </span>
        </Row>
        <Row label="비밀번호">
          <div className="flex min-h-8 items-center gap-7">
            <span className="text-text-primary/60 text-[15px] tracking-[0.16em]">••••••••</span>
            <button
              type="button"
              onClick={() => setPasswordOpen(true)}
              disabled={savingPassword}
              className="text-text-primary/70 hover:text-text-primary min-h-8 shrink-0 px-1 text-[13px] underline underline-offset-4 disabled:opacity-40"
            >
              변경
            </button>
          </div>
        </Row>
      </Section>

      <Section title="계정 관리">
        <button
          type="button"
          onClick={() => setWithdrawOpen(true)}
          disabled={withdrawing}
          className="text-text-primary/70 hover:text-text-primary mt-0.5 min-h-8 text-[13px] underline underline-offset-4 disabled:opacity-40"
        >
          회원 탈퇴
        </button>
      </Section>

      <Modal open={passwordOpen} onClose={closePassword} title="비밀번호 변경" showCloseButton>
        {passwordOpen && (
          <form
            onSubmit={handleChangePassword}
            noValidate
            aria-busy={savingPassword}
            className="flex flex-col gap-5"
          >
            <AuthField
              compact
              label="현재 비밀번호"
              type="password"
              name="currentPassword"
              autoComplete="current-password"
              placeholder="현재 비밀번호 입력"
              required
              autoFocus
              disabled={savingPassword}
              value={currentPassword}
              onChange={(event) => {
                setCurrentPassword(event.target.value)
                setPasswordErrors((previous) => ({
                  ...previous,
                  currentPassword: undefined,
                  form: undefined,
                }))
              }}
              error={passwordErrors.currentPassword}
            />
            <AuthField
              compact
              label="새 비밀번호"
              type="password"
              name="newPassword"
              autoComplete="new-password"
              placeholder="새 비밀번호 입력"
              required
              disabled={savingPassword}
              value={newPassword}
              onChange={(event) => {
                setNewPassword(event.target.value)
                setPasswordErrors((previous) => ({
                  ...previous,
                  newPassword: undefined,
                  newPasswordConfirm: undefined,
                  form: undefined,
                }))
              }}
              error={passwordErrors.newPassword}
            />
            <AuthField
              compact
              label="새 비밀번호 확인"
              type="password"
              name="newPasswordConfirm"
              autoComplete="new-password"
              placeholder="새 비밀번호를 한 번 더 입력"
              required
              disabled={savingPassword}
              value={newPasswordConfirm}
              onChange={(event) => {
                setNewPasswordConfirm(event.target.value)
                setPasswordErrors((previous) => ({
                  ...previous,
                  newPasswordConfirm: undefined,
                  form: undefined,
                }))
              }}
              error={passwordErrors.newPasswordConfirm}
            />
            {passwordErrors.form && (
              <p role="alert" className="text-danger text-[13px]">
                {passwordErrors.form}
              </p>
            )}
            <div className="mt-2 flex justify-end gap-2">
              <Button hierarchy="secondary" onClick={closePassword}>
                취소
              </Button>
              <Button type="submit" disabled={savingPassword}>
                {savingPassword ? '변경 중…' : '변경하기'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={withdrawOpen}
        onClose={closeWithdraw}
        title="정말 탈퇴하시겠어요?"
        showCloseButton
        description="찜한 장소와 팜플렛 등 계정 정보는 삭제되고 복구할 수 없어요. 작성한 리뷰는 계정 연결이 해제되어 남아요."
      >
        {withdrawOpen && (
          <form
            onSubmit={handleWithdraw}
            noValidate
            aria-busy={withdrawing}
            className="flex flex-col gap-5"
          >
            <AuthField
              compact
              label="현재 비밀번호"
              type="password"
              autoComplete="current-password"
              placeholder="비밀번호 입력"
              required
              autoFocus
              value={withdrawPassword}
              disabled={withdrawing}
              onChange={(event) => {
                setWithdrawPassword(event.target.value)
                setWithdrawError(undefined)
              }}
              error={withdrawError}
            />
            <div className="flex justify-end gap-2">
              <Button hierarchy="secondary" onClick={closeWithdraw}>
                취소
              </Button>
              <Button type="submit" disabled={withdrawing}>
                {withdrawing ? '처리 중…' : '탈퇴'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={!!successMessage}
        onClose={() => setSuccessMessage(undefined)}
        title={successMessage}
        primaryAction={{ label: '확인', onClick: () => setSuccessMessage(undefined) }}
      />
    </div>
  )
}
