import { Box, Button, Stack, useToast } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';

import { api } from '../../services/api';
import { FileInput } from '../Input/FileInput';
import { TextInput } from '../Input/TextInput';

interface FormAddImageProps {
  closeModal: () => void;
}

export function FormAddImage({ closeModal }: FormAddImageProps): JSX.Element {
  const [imageUrl, setImageUrl] = useState('');
  const [localImageUrl, setLocalImageUrl] = useState('');
  const toast = useToast();

  const formValidations = {
    image: {
      required: 'A imagem é obrigatória',
      validate: {
        lessThan10MB: (files: HTMLInputElement) =>
          files[0]?.size < 10000000 || 'Max 10MB',
        acceptedFormats: (files: HTMLInputElement) =>
          ['image/jpeg', 'image/png', 'image/gif'].includes(files[0]?.type) ||
          'Somente PNG, JPEG e GIF',
      },
    },
    title: {
      required: 'O campo título é obrigatório',
      minLength: {
        value: 2,
        message: 'Mínimo 2 caracteres',
      },
      maxLength: {
        value: 12,
        message: 'Máximo 12 caracteres',
      },
    },
    description: {
      required: 'A descrição é obrigatória',
      maxLength: {
        value: 20,
        message: 'Máximo 20 caracteres',
      },
    },
  };

  const queryClient = useQueryClient();
  const mutation = useMutation(
    async (image: Record<string, unknown>) => {
      const { title, description, url } = image;

      const response = await api.post('/api/images', {
        title,
        description,
        url,
      });

      return response.data.image;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('images');
      },
    }
  );

  const { register, handleSubmit, reset, formState, setError, trigger } =
    useForm();
  const { errors } = formState;

  const onSubmit = async (data: Record<string, unknown>): Promise<void> => {
    try {
      if (!setImageUrl) {
        toast({
          title: 'Erro',
          description: 'A url da imagem não existe',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });

        return;
      }

      await mutation.mutateAsync({ ...data, url: imageUrl });

      toast({
        title: 'Sucesso!',
        description: 'Sua imagem foi salva com sucesso.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch {
      toast({
        title: 'Falha no envio',
        description: 'Ocorreu um erro ao enviar',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      reset();
      closeModal();
    }
  };

  return (
    <Box as="form" width="100%" onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={4}>
        <FileInput
          setImageUrl={setImageUrl}
          localImageUrl={localImageUrl}
          setLocalImageUrl={setLocalImageUrl}
          setError={setError}
          trigger={trigger}
          error={errors.image}
          {...register('image', formValidations.image)}
        />

        <TextInput
          placeholder="Título da imagem..."
          {...register('title', formValidations.title)}
          error={errors.title}
        />

        <TextInput
          placeholder="Descrição da imagem..."
          {...register('description', formValidations.description)}
          error={!!errors.description}
        />
      </Stack>

      <Button
        my={6}
        isLoading={formState.isSubmitting}
        isDisabled={formState.isSubmitting}
        type="submit"
        w="100%"
        py={6}
      >
        Enviar
      </Button>
    </Box>
  );
}
