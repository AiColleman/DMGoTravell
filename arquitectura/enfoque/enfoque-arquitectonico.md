# 10. Enfoque Arquitectónico



Para estructurar internamente el backend en .NET de DMGOTRAVEL y garantizar su evolución a largo plazo, el sistema define sus dependencias internas mediante **Clean Architecture**.

A continuación, se detalla el enfoque arquitectónico adaptado a las tecnologías del proyecto:

| Elemento | Descripción aplicada a DMGOTRAVEL |
| :--- | :--- |
| **Patrón / enfoque arquitectónico** | Clean Architecture (Arquitectura Limpia), complementada con el patrón CQRS (Command and Query Responsibility Segregation). |
| **Objetivo** | Separar responsabilidades y controlar las dependencias hacia el dominio. |
| **¿Qué problema resuelve?** | Evita el acoplamiento entre la interfaz React, las reglas del negocio y las tecnologías externas, como bases de datos, API y servicios de pago (como PostgreSQL, Culqi o Resend). |
| **Capas definidas** | Presentación, Aplicación, Dominio e Infraestructura. |
| **Beneficios** | • Facilita el mantenimiento y las pruebas unitarias.<br>• Permite cambiar implementaciones técnicas sin modificar innecesariamente las reglas del negocio.<br>• Mejora la organización y separación de responsabilidades del código. |

![Enfoque arquitectónico de DMGOTRAVEL](../imagenes/DMGOTRAVEL-enfoque.png)
