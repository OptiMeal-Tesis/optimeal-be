export const swaggerSchemas = {
    // Common Schemas
    Error: {
        type: 'object',
        properties: {
            success: {
                type: 'boolean',
                example: false
            },
            message: {
                type: 'string',
                example: 'Error message'
            },
            errors: {
                type: 'array',
                items: {
                    type: 'string'
                },
                example: ['Validation error 1', 'Validation error 2']
            }
        }
    },
    Success: {
        type: 'object',
        properties: {
            success: {
                type: 'boolean',
                example: true
            },
            message: {
                type: 'string',
                example: 'Operation successful'
            },
            data: {
                type: 'object',
                description: 'Response data'
            }
        }
    },

    // Auth Schemas
    SignupRequest: {
        type: 'object',
        required: ['email', 'password', 'national_id'],
        properties: {
            email: {
                type: 'string',
                format: 'email',
                example: 'user@example.com',
                description: 'Email del usuario'
            },
            password: {
                type: 'string',
                minLength: 8,
                example: 'password123',
                description: 'Contraseña (mínimo 8 caracteres)'
            },
            name: {
                type: 'string',
                minLength: 2,
                example: 'Juan Pérez',
                description: 'Nombre del usuario (opcional)'
            },
            national_id: {
                type: 'string',
                pattern: '^\\d{7,10}$',
                example: '12345678',
                description: 'Cédula de identidad (7-10 dígitos)'
            },
            role: {
                type: 'string',
                enum: ['USER', 'ADMIN'],
                default: 'USER',
                example: 'USER',
                description: 'Rol del usuario'
            }
        }
    },
    LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
            email: {
                type: 'string',
                format: 'email',
                example: 'user@example.com'
            },
            password: {
                type: 'string',
                example: 'password123'
            }
        }
    },
    ConfirmSignupRequest: {
        type: 'object',
        required: ['email', 'confirmationCode'],
        properties: {
            email: {
                type: 'string',
                format: 'email',
                example: 'user@example.com'
            },
            confirmationCode: {
                type: 'string',
                length: 6,
                example: '123456',
                description: 'Código de confirmación de 6 dígitos'
            }
        }
    },
    AuthResponse: {
        type: 'object',
        properties: {
            success: {
                type: 'boolean',
                example: true
            },
            message: {
                type: 'string',
                example: 'User created successfully'
            },
            data: {
                type: 'object',
                properties: {
                    user: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'string',
                                example: 'user123'
                            },
                            email: {
                                type: 'string',
                                example: 'user@example.com'
                            },
                            name: {
                                type: 'string',
                                example: 'Juan Pérez'
                            },
                            role: {
                                type: 'string',
                                example: 'USER'
                            }
                        }
                    },
                    token: {
                        type: 'string',
                        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        description: 'Token JWT (solo en login)'
                    }
                }
            }
        }
    },

    // Product Schemas
    CreateProductRequest: {
        type: 'object',
        required: ['name', 'description', 'price', 'type'],
        properties: {
            name: {
                type: 'string',
                minLength: 1,
                maxLength: 100,
                example: 'Hamburguesa Clásica',
                description: 'Nombre del producto'
            },
            description: {
                type: 'string',
                minLength: 1,
                maxLength: 500,
                example: 'Deliciosa hamburguesa con carne, lechuga, tomate y queso',
                description: 'Descripción del producto'
            },
            price: {
                type: 'integer',
                minimum: 1,
                example: 15000,
                description: 'Precio en centavos'
            },
            photo: {
                type: 'string',
                format: 'uri',
                example: 'https://example.com/photo.jpg',
                description: 'URL de la foto del producto (opcional)'
            },
            restrictions: {
                type: 'array',
                items: {
                    type: 'string',
                    enum: ['VEGETARIAN', 'VEGAN', 'GLUTEN_FREE', 'DAIRY_FREE', 'NUT_FREE']
                },
                example: ['VEGETARIAN'],
                description: 'Restricciones alimentarias'
            },
            sides: {
                type: 'array',
                items: {
                    type: 'string'
                },
                example: ['Papas fritas', 'Ensalada'],
                description: 'Acompañamientos disponibles'
            },
            admitsClarifications: {
                type: 'boolean',
                default: false,
                example: true,
                description: 'Si el producto admite aclaraciones especiales'
            },
            type: {
                type: 'string',
                enum: ['FOOD', 'BEVERAGE'],
                example: 'FOOD',
                description: 'Tipo de producto'
            },
            stock: {
                type: 'integer',
                minimum: 0,
                default: 0,
                example: 50,
                description: 'Cantidad en stock'
            }
        }
    },
    UpdateProductRequest: {
        type: 'object',
        properties: {
            name: {
                type: 'string',
                minLength: 1,
                maxLength: 100,
                example: 'Hamburguesa Clásica Premium'
            },
            description: {
                type: 'string',
                minLength: 1,
                maxLength: 500,
                example: 'Hamburguesa premium con ingredientes de primera calidad'
            },
            price: {
                type: 'integer',
                minimum: 1,
                example: 18000
            },
            photo: {
                type: 'string',
                format: 'uri',
                example: 'https://example.com/new-photo.jpg'
            },
            restrictions: {
                type: 'array',
                items: {
                    type: 'string',
                    enum: ['VEGETARIAN', 'VEGAN', 'GLUTEN_FREE', 'DAIRY_FREE', 'NUT_FREE']
                },
                example: ['VEGETARIAN', 'GLUTEN_FREE']
            },
            sides: {
                type: 'array',
                items: {
                    type: 'string'
                },
                example: ['Papas fritas', 'Ensalada', 'Aros de cebolla']
            },
            admitsClarifications: {
                type: 'boolean',
                example: true
            },
            type: {
                type: 'string',
                enum: ['FOOD', 'BEVERAGE'],
                example: 'FOOD'
            },
            stock: {
                type: 'integer',
                minimum: 0,
                example: 75
            }
        }
    },
    Product: {
        type: 'object',
        properties: {
            id: {
                type: 'integer',
                example: 1
            },
            name: {
                type: 'string',
                example: 'Hamburguesa Clásica'
            },
            description: {
                type: 'string',
                example: 'Deliciosa hamburguesa con carne, lechuga, tomate y queso'
            },
            price: {
                type: 'integer',
                example: 15000
            },
            photo: {
                type: 'string',
                example: 'https://example.com/photo.jpg'
            },
            restrictions: {
                type: 'array',
                items: {
                    type: 'string',
                    enum: ['VEGETARIAN', 'VEGAN', 'GLUTEN_FREE', 'DAIRY_FREE', 'NUT_FREE']
                },
                example: ['VEGETARIAN']
            },
            sides: {
                type: 'array',
                items: {
                    type: 'string'
                },
                example: ['Papas fritas', 'Ensalada']
            },
            admitsClarifications: {
                type: 'boolean',
                example: true
            },
            type: {
                type: 'string',
                enum: ['FOOD', 'BEVERAGE'],
                example: 'FOOD'
            },
            stock: {
                type: 'integer',
                example: 50
            },
            createdAt: {
                type: 'string',
                format: 'date-time',
                example: '2024-01-15T10:30:00Z'
            },
            updatedAt: {
                type: 'string',
                format: 'date-time',
                example: '2024-01-15T10:30:00Z'
            }
        }
    },
    ProductResponse: {
        type: 'object',
        properties: {
            success: {
                type: 'boolean',
                example: true
            },
            message: {
                type: 'string',
                example: 'Product retrieved successfully'
            },
            data: {
                $ref: '#/components/schemas/Product'
            }
        }
    },
    ProductsResponse: {
        type: 'object',
        properties: {
            success: {
                type: 'boolean',
                example: true
            },
            message: {
                type: 'string',
                example: 'Products retrieved successfully'
            },
            data: {
                type: 'array',
                items: {
                    $ref: '#/components/schemas/Product'
                }
            }
        }
    },

    // Side Schemas
    Side: {
        type: 'object',
        properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Papas fritas' },
            isActive: { type: 'boolean', example: true }
        }
    },
    SidesResponse: {
        type: 'object',
        properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Sides retrieved successfully' },
            data: {
                type: 'array',
                items: { $ref: '#/components/schemas/Side' }
            }
        }
    },

    // Health Schema
    HealthResponse: {
        type: 'object',
        properties: {
            status: {
                type: 'string',
                example: 'ok'
            },
            time: {
                type: 'string',
                format: 'date-time',
                example: '2024-01-15T10:30:00Z'
            }
        }
    },

    // Order Schemas
    DishSummary: {
        type: 'object',
        properties: {
            id: {
                type: 'integer',
                example: 1,
                description: 'ID del plato principal'
            },
            name: {
                type: 'string',
                example: 'Pechuga de pollo con guarnición',
                description: 'Nombre del plato principal'
            },
            totalToPrepare: {
                type: 'integer',
                example: 20,
                description: 'Cantidad total a preparar'
            },
            preparedQuantity: {
                type: 'integer',
                example: 15,
                description: 'Cantidad ya preparada'
            },
            remainingToPrepare: {
                type: 'integer',
                example: 5,
                description: 'Cantidad restante por preparar'
            },
            photo: {
                type: 'string',
                format: 'uri',
                example: 'https://example.com/chicken.jpg',
                description: 'URL de la foto del plato (opcional)'
            }
        }
    },
    SideSummary: {
        type: 'object',
        properties: {
            id: {
                type: 'integer',
                example: 1,
                description: 'ID del acompañamiento'
            },
            name: {
                type: 'string',
                example: 'Puré de papas',
                description: 'Nombre del acompañamiento'
            },
            totalToPrepare: {
                type: 'integer',
                example: 20,
                description: 'Cantidad total a preparar'
            },
            preparedQuantity: {
                type: 'integer',
                example: 15,
                description: 'Cantidad ya preparada'
            },
            remainingToPrepare: {
                type: 'integer',
                example: 5,
                description: 'Cantidad restante por preparar'
            }
        }
    },
    ShiftDishesResponse: {
        type: 'object',
        properties: {
            success: {
                type: 'boolean',
                example: true
            },
            message: {
                type: 'string',
                example: 'Dishes retrieved successfully'
            },
            data: {
                type: 'object',
                properties: {
                    shift: {
                        type: 'string',
                        example: '12-13',
                        description: 'Turno consultado'
                    },
                    mainDishes: {
                        type: 'array',
                        items: {
                            $ref: '#/components/schemas/DishSummary'
                        },
                        description: 'Lista de platos principales'
                    },
                    sides: {
                        type: 'array',
                        items: {
                            $ref: '#/components/schemas/SideSummary'
                        },
                        description: 'Lista de acompañamientos'
                    },
                    totalMainDishes: {
                        type: 'integer',
                        example: 37,
                        description: 'Total de platos principales a preparar'
                    },
                    totalSides: {
                        type: 'integer',
                        example: 40,
                        description: 'Total de acompañamientos a preparar'
                    }
                }
            }
        }
    }
};
