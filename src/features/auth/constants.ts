/** ratio는 원본 가로/세로. 이미지를 교체하면 함께 고쳐야 한다. */
export const AUTH_IMAGES = {
  login: { src: 'login.jpg', ratio: 697 / 1024 },
  /** TODO: signup.jpg 실제 파일이 들어오면 원본 크기로 고칠 것 */
  signup: { src: 'signup.jpg', ratio: 697 / 1024 },
} as const
