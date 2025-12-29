'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { DottedSeparator } from '@/components/dotted-separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { getImageUrl } from '@/lib/utils';

import { useUpdateProfile } from '../api/use-update-profile';
import { updateProfileSchema } from '../schema';
import { AppUser } from '../type';

interface EditProfileFormProps {
  onCancel?: () => void;
  initialValues: AppUser;
}

export const EditProfileForm = ({ onCancel, initialValues }: EditProfileFormProps) => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const updateProfileForm = useForm<z.infer<typeof updateProfileSchema>>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: initialValues.name ?? '',
      phoneNumber: initialValues.phoneNumber ?? '',
      designation: initialValues.designation ?? '',
      birthDate: initialValues.birthDate ? new Date(initialValues.birthDate) : undefined, // Convert string to Date
      image: initialValues.imageUrl ?? '',
    },
  });

  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const onSubmit = (values: z.infer<typeof updateProfileSchema>) => {
    const finalValues = {
      ...values,
      birthDate: values.birthDate ? values.birthDate.toISOString().split('T')[0] : undefined,
      // birthDate: values.birthDate ? new Date(values.birthDate) : undefined,
      image: values.image instanceof File ? values.image : '',
    };

    updateProfile({
      form: finalValues,
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const MAX_FILE_SIZE = 1 * 1024 * 1024;
    const file = e.target.files?.[0];

    if (file && file.size <= MAX_FILE_SIZE) {
      updateProfileForm.setValue('image', file);
    }
  };

  return (
    <Card className="size-full border-none shadow-none">
      <CardHeader className="flex flex-row items-center gap-x-4 space-y-0 p-7">
        <Button size="sm" variant="secondary" onClick={onCancel ? onCancel : () => router.back()} className="gap-x-1">
          <ArrowLeft className="size-4" />
          Back
        </Button>

        <CardTitle className="text-xl font-bold">Edit Profile</CardTitle>
      </CardHeader>

      <div className="px-7">
        <DottedSeparator />
      </div>

      <CardContent className="p-7">
        <Form {...updateProfileForm}>
          <form onSubmit={updateProfileForm.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              disabled={isPending}
              control={updateProfileForm.control}
              name="image"
              render={({ field }) => (
                <div className="flex flex-col gap-y-2">
                  <div className="flex items-center gap-x-5">
                    {field.value ? (
                      <div className="relative size-[72px] overflow-hidden rounded-md">
                        <Image
                          src={field.value instanceof File ? URL.createObjectURL(field.value) : getImageUrl(field.value)}
                          alt="Profile"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <Avatar className="size-[72px]">
                        <AvatarFallback>
                          <ImageIcon className="size-[36px] text-neutral-400" />
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className="flex flex-col">
                      <p className="text-sm">Profile Photo</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG, or JPEG, max 1MB</p>

                      <input
                        type="file"
                        className="hidden"
                        onChange={handleImageChange}
                        accept=".jpg, .png, .jpeg, .webp"
                        ref={inputRef}
                        disabled={isPending}
                      />

                      {field.value ? (
                        <Button
                          type="button"
                          disabled={isPending}
                          variant="destructive"
                          size="xs"
                          className="mt-2 w-fit"
                          onClick={() => {
                            field.onChange('');
                            if (inputRef.current) inputRef.current.value = '';
                          }}
                        >
                          Remove Image
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          disabled={isPending}
                          variant="tertiary"
                          size="xs"
                          className="mt-2 w-fit"
                          onClick={() => inputRef.current?.click()}
                        >
                          Upload Image
                        </Button>
                      )}
                    </div>
                  </div>

                  <FormMessage />
                </div>
              )}
            />

            <FormField
              disabled={isPending}
              control={updateProfileForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter full name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              disabled={isPending}
              control={updateProfileForm.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter PhoneNumber" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              disabled={isPending}
              control={updateProfileForm.control}
              name="designation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Designation</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter Designation" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              disabled={isPending}
              control={updateProfileForm.control}
              name="birthDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              disabled={isPending}
              control={updateProfileForm.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="MALE"
                          checked={field.value === 'MALE'}
                          onChange={() => field.onChange('MALE')}
                          disabled={isPending}
                        />
                        Male
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="FEMALE"
                          checked={field.value === 'FEMALE'}
                          onChange={() => field.onChange('FEMALE')}
                          disabled={isPending}
                        />
                        Female
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="NONBINARY"
                          checked={field.value === 'NONBINARY'}
                          onChange={() => field.onChange('NONBINARY')}
                          disabled={isPending}
                        />
                        Non-Binary
                      </label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DottedSeparator className="py-7" />

            <div className="flex items-center justify-between">
              <Button
                disabled={isPending}
                type="button"
                size="lg"
                variant="secondary"
                onClick={onCancel}
                className={!onCancel ? 'invisible' : ''}
              >
                Cancel
              </Button>

              <Button disabled={isPending} type="submit" size="lg">
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
