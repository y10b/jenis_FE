'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Loader2, Check, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { signup } from '@/services/auth';

interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone?: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    mode: 'onChange',
  });

  const password = watch('password');
  const confirmPassword = watch('confirmPassword');

  const passwordRequirements = [
    { label: '8자 이상', test: (p: string) => p?.length >= 8 },
    { label: '대문자 포함', test: (p: string) => /[A-Z]/.test(p || '') },
    { label: '소문자 포함', test: (p: string) => /[a-z]/.test(p || '') },
    { label: '숫자 포함', test: (p: string) => /\d/.test(p || '') },
    { label: '특수문자 포함', test: (p: string) => /[@$!%*?&]/.test(p || '') },
  ];

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      await signup({
        email: data.email,
        password: data.password,
        name: data.name,
      });
      toast.success('회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.');
      router.push('/login');
    } catch (error: any) {
      const message = error.response?.data?.message || '회원가입에 실패했습니다.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <h1 className="text-xl font-semibold text-center">회원가입</h1>
        <p className="text-sm text-muted-foreground text-center mt-1">
          새 계정을 생성하세요
        </p>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm">이름</Label>
            <Input
              id="name"
              placeholder="홍길동"
              className="h-10"
              {...register('name', {
                required: '이름을 입력해주세요.',
                minLength: {
                  value: 2,
                  message: '이름은 최소 2자 이상이어야 합니다.',
                },
              })}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              className="h-10"
              {...register('email', {
                required: '이메일을 입력해주세요.',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: '올바른 이메일 형식이 아닙니다.',
                },
              })}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm">
              전화번호 <span className="text-muted-foreground font-normal">(선택)</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="010-1234-5678"
              className="h-10"
              {...register('phone', {
                pattern: {
                  value: /^[0-9]{2,3}-?[0-9]{3,4}-?[0-9]{4}$/,
                  message: '올바른 전화번호 형식이 아닙니다.',
                },
              })}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm">비밀번호</Label>
            <Input
              id="password"
              type="password"
              className="h-10"
              {...register('password', {
                required: '비밀번호를 입력해주세요.',
                minLength: {
                  value: 8,
                  message: '비밀번호는 최소 8자 이상이어야 합니다.',
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                  message: '비밀번호 조건을 확인해주세요.',
                },
              })}
            />
            {password && (
              <div className="flex flex-wrap gap-2 mt-2">
                {passwordRequirements.map((req, i) => {
                  const passed = req.test(password);
                  return (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${
                        passed
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700'
                      }`}
                    >
                      {passed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      {req.label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm">비밀번호 확인</Label>
            <Input
              id="confirmPassword"
              type="password"
              className="h-10"
              {...register('confirmPassword', {
                required: '비밀번호 확인을 입력해주세요.',
                validate: (value) =>
                  value === password || '비밀번호가 일치하지 않습니다.',
              })}
            />
            {confirmPassword && password && (
              <p className={`text-xs flex items-center gap-1 ${
                confirmPassword === password ? 'text-emerald-600' : 'text-destructive'
              }`}>
                {confirmPassword === password ? (
                  <>
                    <Check className="h-3 w-3" />
                    비밀번호가 일치합니다
                  </>
                ) : (
                  <>
                    <X className="h-3 w-3" />
                    비밀번호가 일치하지 않습니다
                  </>
                )}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pt-2">
          <Button type="submit" className="w-full h-10" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                가입 중...
              </>
            ) : (
              '회원가입'
            )}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">
              로그인
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
