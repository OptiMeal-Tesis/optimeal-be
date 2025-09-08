export const swaggerPaths = {
    // Health endpoints
    '/health': {
        get: {
            tags: ['Health'],
            summary: 'Verificar el estado de la API',
            description: 'Endpoint para verificar que la API esté funcionando correctamente',
            responses: {
                '200': {
                    description: 'API funcionando correctamente',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/HealthResponse'
                            },
                            example: {
                                status: 'ok',
                                time: '2024-01-15T10:30:00.000Z'
                            }
                        }
                    }
                }
            }
        }
    },

    // Auth endpoints
    '/auth/signup': {
        post: {
            tags: ['Authentication'],
            summary: 'Registrar un nuevo usuario',
            description: 'Crea una nueva cuenta de usuario en el sistema',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/SignupRequest'
                        },
                        example: {
                            email: 'usuario@ejemplo.com',
                            password: 'password123',
                            name: 'Juan Pérez',
                            national_id: '12345678',
                            role: 'USER'
                        }
                    }
                }
            },
            responses: {
                '201': {
                    description: 'Usuario registrado exitosamente',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/AuthResponse'
                            },
                            example: {
                                success: true,
                                message: 'User created successfully',
                                data: {
                                    user: {
                                        id: 'user123',
                                        email: 'usuario@ejemplo.com',
                                        name: 'Juan Pérez',
                                        role: 'USER'
                                    }
                                }
                            }
                        }
                    }
                },
                '400': {
                    description: 'Error en la validación o registro',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            },
                            example: {
                                success: false,
                                message: 'Validation error',
                                errors: ['Email already exists']
                            }
                        }
                    }
                }
            }
        }
    },

    '/auth/confirm': {
        post: {
            tags: ['Authentication'],
            summary: 'Confirmar registro de usuario',
            description: 'Confirma el registro de usuario con el código de verificación',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ConfirmSignupRequest'
                        },
                        example: {
                            email: 'usuario@ejemplo.com',
                            confirmationCode: '123456'
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Usuario confirmado exitosamente',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Success'
                            },
                            example: {
                                success: true,
                                message: 'User confirmed successfully',
                                data: {}
                            }
                        }
                    }
                },
                '400': {
                    description: 'Error en la confirmación',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            },
                            example: {
                                success: false,
                                message: 'Invalid confirmation code',
                                errors: ['Confirmation code is invalid or expired']
                            }
                        }
                    }
                }
            }
        }
    },

    '/auth/login': {
        post: {
            tags: ['Authentication'],
            summary: 'Iniciar sesión',
            description: 'Autentica un usuario y retorna un token JWT',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/LoginRequest'
                        },
                        example: {
                            email: 'usuario@ejemplo.com',
                            password: 'password123'
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Login exitoso',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/AuthResponse'
                            },
                            example: {
                                success: true,
                                message: 'Login successful',
                                data: {
                                    user: {
                                        id: 'user123',
                                        email: 'usuario@ejemplo.com',
                                        name: 'Juan Pérez',
                                        role: 'USER'
                                    },
                                    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                                }
                            }
                        }
                    }
                },
                '401': {
                    description: 'Credenciales inválidas',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            },
                            example: {
                                success: false,
                                message: 'Invalid credentials',
                                errors: ['Email or password is incorrect']
                            }
                        }
                    }
                }
            }
        }
    },

    // Product endpoints
    '/products': {
        get: {
            tags: ['Products'],
            summary: 'Obtener todos los productos',
            description: 'Retorna una lista de todos los productos disponibles',
            responses: {
                '200': {
                    description: 'Lista de productos obtenida exitosamente',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ProductsResponse'
                            }
                        }
                    }
                },
                '401': {
                    description: 'No autorizado',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                },
                '500': {
                    description: 'Error interno del servidor',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                }
            }
        },
        post: {
            tags: ['Products'],
            summary: 'Crear un nuevo producto',
            description: 'Crea un nuevo producto en el sistema (solo administradores). Usa FormData para permitir subida de archivos.',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'multipart/form-data': {
                        schema: {
                            type: 'object',
                            properties: {
                                name: {
                                    type: 'string',
                                    description: 'Nombre del producto',
                                    example: 'Hamburguesa Clásica'
                                },
                                description: {
                                    type: 'string',
                                    description: 'Descripción del producto',
                                    example: 'Deliciosa hamburguesa con carne, lechuga, tomate y queso'
                                },
                                price: {
                                    type: 'number',
                                    description: 'Precio del producto',
                                    example: 15000
                                },
                                photo: {
                                    type: 'string',
                                    format: 'binary',
                                    description: 'Imagen del producto (opcional)'
                                },
                                restrictions: {
                                    type: 'array',
                                    items: {
                                        type: 'string',
                                        enum: ['VEGETARIAN', 'VEGAN', 'GLUTEN_FREE', 'DAIRY_FREE']
                                    },
                                    description: 'Restricciones alimentarias',
                                    example: ['VEGETARIAN']
                                },
                                sides: {
                                    type: 'array',
                                    items: {
                                        type: 'string'
                                    },
                                    description: 'Acompañamientos disponibles',
                                    example: ['Papas fritas', 'Ensalada']
                                },
                                admitsClarifications: {
                                    type: 'boolean',
                                    description: 'Si el producto admite aclaraciones',
                                    example: true
                                },
                                type: {
                                    type: 'string',
                                    enum: ['FOOD', 'DRINK', 'DESSERT'],
                                    description: 'Tipo de producto',
                                    example: 'FOOD'
                                },
                                stock: {
                                    type: 'integer',
                                    description: 'Cantidad en stock',
                                    example: 50
                                }
                            },
                            required: ['name', 'description', 'price', 'type', 'stock']
                        }
                    }
                }
            },
            responses: {
                '201': {
                    description: 'Producto creado exitosamente',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ProductResponse'
                            }
                        }
                    }
                },
                '400': {
                    description: 'Error en la validación',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                },
                '401': {
                    description: 'No autorizado',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                },
                '403': {
                    description: 'Acceso denegado (solo administradores)',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                }
            }
        }
    },

    '/products/{id}': {
        get: {
            tags: ['Products'],
            summary: 'Obtener un producto por ID',
            description: 'Retorna la información de un producto específico',
            parameters: [
                {
                    in: 'path',
                    name: 'id',
                    required: true,
                    schema: {
                        type: 'integer'
                    },
                    description: 'ID del producto',
                    example: 1
                }
            ],
            responses: {
                '200': {
                    description: 'Producto obtenido exitosamente',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ProductResponse'
                            }
                        }
                    }
                },
                '401': {
                    description: 'No autorizado',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                },
                '404': {
                    description: 'Producto no encontrado',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                }
            }
        },
        put: {
            tags: ['Products'],
            summary: 'Actualizar un producto',
            description: 'Actualiza la información de un producto existente (solo administradores). Usa FormData para permitir subida de archivos.',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'id',
                    required: true,
                    schema: {
                        type: 'integer'
                    },
                    description: 'ID del producto',
                    example: 1
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'multipart/form-data': {
                        schema: {
                            type: 'object',
                            properties: {
                                name: {
                                    type: 'string',
                                    description: 'Nombre del producto',
                                    example: 'Hamburguesa Clásica Premium'
                                },
                                description: {
                                    type: 'string',
                                    description: 'Descripción del producto',
                                    example: 'Hamburguesa premium con ingredientes de primera calidad'
                                },
                                price: {
                                    type: 'number',
                                    description: 'Precio del producto',
                                    example: 18000
                                },
                                photo: {
                                    type: 'string',
                                    format: 'binary',
                                    description: 'Imagen del producto (opcional)'
                                },
                                restrictions: {
                                    type: 'array',
                                    items: {
                                        type: 'string',
                                        enum: ['VEGETARIAN', 'VEGAN', 'GLUTEN_FREE', 'DAIRY_FREE']
                                    },
                                    description: 'Restricciones alimentarias',
                                    example: ['VEGETARIAN']
                                },
                                sides: {
                                    type: 'array',
                                    items: {
                                        type: 'string'
                                    },
                                    description: 'Acompañamientos disponibles',
                                    example: ['Papas fritas', 'Ensalada']
                                },
                                admitsClarifications: {
                                    type: 'boolean',
                                    description: 'Si el producto admite aclaraciones',
                                    example: true
                                },
                                type: {
                                    type: 'string',
                                    enum: ['FOOD', 'DRINK', 'DESSERT'],
                                    description: 'Tipo de producto',
                                    example: 'FOOD'
                                },
                                stock: {
                                    type: 'integer',
                                    description: 'Cantidad en stock',
                                    example: 75
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Producto actualizado exitosamente',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ProductResponse'
                            }
                        }
                    }
                },
                '400': {
                    description: 'Error en la validación',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                },
                '401': {
                    description: 'No autorizado',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                },
                '403': {
                    description: 'Acceso denegado (solo administradores)',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                },
                '404': {
                    description: 'Producto no encontrado',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                }
            }
        },
        delete: {
            tags: ['Products'],
            summary: 'Eliminar un producto',
            description: 'Elimina un producto del sistema (solo administradores)',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'id',
                    required: true,
                    schema: {
                        type: 'integer'
                    },
                    description: 'ID del producto',
                    example: 1
                }
            ],
            responses: {
                '200': {
                    description: 'Producto eliminado exitosamente',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Success'
                            },
                            example: {
                                success: true,
                                message: 'Product deleted successfully',
                                data: {}
                            }
                        }
                    }
                },
                '401': {
                    description: 'No autorizado',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                },
                '403': {
                    description: 'Acceso denegado (solo administradores)',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                },
                '404': {
                    description: 'Producto no encontrado',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                }
            }
        }
    }
};
