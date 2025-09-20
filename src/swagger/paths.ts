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

    // Side endpoints
    '/sides': {
        get: {
            tags: ['Sides'],
            summary: 'Obtener todos los acompañamientos',
            description: 'Retorna todos los sides. Requiere rol ADMIN.',
            security: [{ bearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Lista de sides obtenida exitosamente',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/SidesResponse' }
                        }
                    }
                },
                '401': {
                    description: 'No autorizado',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
                },
                '403': {
                    description: 'Acceso denegado (solo administradores)',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
                },
                '500': {
                    description: 'Error interno del servidor',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
                }
            }
        },
        post: {
            tags: ['Sides'],
            summary: 'Crear un side',
            description: 'Crea un nuevo acompañamiento. Requiere rol ADMIN.',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                name: { type: 'string', example: 'Papas fritas' },
                                isActive: { type: 'boolean', example: true }
                            },
                            required: ['name']
                        }
                    }
                }
            },
            responses: {
                '201': {
                    description: 'Side creado exitosamente',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Side' }
                        }
                    }
                },
                '400': {
                    description: 'Error en la validación',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
                },
                '401': {
                    description: 'No autorizado',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
                },
                '403': {
                    description: 'Acceso denegado (solo administradores)',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
                }
            }
        }
    },

    '/sides/active': {
        get: {
            tags: ['Sides'],
            summary: 'Obtener sides activos (público)',
            description: 'Retorna la lista de acompañamientos activos. No requiere autenticación.',
            responses: {
                '200': {
                    description: 'Lista de sides activos obtenida exitosamente',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/SidesResponse' }
                        }
                    }
                },
                '500': {
                    description: 'Error interno del servidor',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
                }
            }
        }
    },

    '/sides/{id}': {
        put: {
            tags: ['Sides'],
            summary: 'Actualizar un side',
            description: 'Actualiza el nombre y estado de un acompañamiento. Requiere rol ADMIN.',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'id',
                    required: true,
                    schema: { type: 'integer' },
                    description: 'ID del side',
                    example: 1
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                name: { type: 'string', example: 'Papas fritas grandes' },
                                isActive: { type: 'boolean', example: true }
                            },
                            required: ['name', 'isActive']
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Side actualizado exitosamente',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Side' }
                        }
                    }
                },
                '400': {
                    description: 'Error en la validación',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
                },
                '401': {
                    description: 'No autorizado',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
                },
                '403': {
                    description: 'Acceso denegado (solo administradores)',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
                },
                '404': {
                    description: 'Side no encontrado',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
                }
            }
        },
        delete: {
            tags: ['Sides'],
            summary: 'Eliminar un side por ID',
            description: 'Elimina un acompañamiento por ID. Requiere rol ADMIN.',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'id',
                    required: true,
                    schema: { type: 'integer' },
                    description: 'ID del side',
                    example: 1
                }
            ],
            responses: {
                '200': {
                    description: 'Side eliminado exitosamente',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Success' },
                            example: { success: true, message: 'Side deleted successfully', data: {} }
                        }
                    }
                },
                '401': {
                    description: 'No autorizado',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
                },
                '403': {
                    description: 'Acceso denegado (solo administradores)',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
                },
                '404': {
                    description: 'Side no encontrado',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
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
    },

    // Order endpoints
    '/orders/shift/dishes': {
        get: {
            tags: ['Orders'],
            summary: 'Obtener resumen de platos por turno',
            description: 'Retorna un resumen de los platos principales y acompañamientos que se deben preparar para un turno específico del día actual. Los turnos disponibles son: 11-12, 12-13, 13-14, 14-15, y "all" para todos los turnos del día. Si no se especifica turno, por defecto usa "all". Requiere rol ADMIN.',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'query',
                    name: 'shift',
                    required: false,
                    schema: {
                        type: 'string',
                        enum: ['11-12', '12-13', '13-14', '14-15', 'all']
                    },
                    description: 'Turno para el cual obtener el resumen de platos. Valores válidos: 11-12, 12-13, 13-14, 14-15, all. Por defecto es "all"',
                    example: '12-13'
                }
            ],
            responses: {
                '200': {
                    description: 'Resumen de platos obtenido exitosamente',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ShiftDishesResponse'
                            },
                            example: {
                                success: true,
                                message: 'Dishes retrieved successfully',
                                data: {
                                    shift: '12-13',
                                    mainDishes: [
                                        {
                                            id: 1,
                                            name: 'Pechuga de pollo con guarnición',
                                            totalToPrepare: 20,
                                            preparedQuantity: 15,
                                            remainingToPrepare: 5,
                                            photo: 'https://example.com/chicken.jpg'
                                        },
                                        {
                                            id: 2,
                                            name: 'Carne al horno con papas',
                                            totalToPrepare: 17,
                                            preparedQuantity: 12,
                                            remainingToPrepare: 5,
                                            photo: 'https://example.com/roasted-meat.jpg'
                                        }
                                    ],
                                    sides: [
                                        {
                                            id: 1,
                                            name: 'Puré de papas',
                                            totalToPrepare: 20,
                                            preparedQuantity: 15,
                                            remainingToPrepare: 5
                                        },
                                        {
                                            id: 2,
                                            name: 'Papas fritas',
                                            totalToPrepare: 20,
                                            preparedQuantity: 15,
                                            remainingToPrepare: 5
                                        }
                                    ],
                                    totalMainDishes: 37,
                                    totalSides: 40
                                }
                            }
                        }
                    }
                },
                '400': {
                    description: 'Error en los parámetros de consulta',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            },
                            example: {
                                success: false,
                                message: 'Invalid query parameters',
                                errors: [
                                    {
                                        code: 'invalid_enum_value',
                                        expected: ['11-12', '12-13', '13-14', '14-15', 'all'],
                                        received: 'invalid-shift',
                                        path: ['shift'],
                                        message: 'Invalid enum value'
                                    }
                                ]
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
        }
    }
};
