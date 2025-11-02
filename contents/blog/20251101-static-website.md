A static website is a foundational type of online presence where the content is fixed and delivered to every visitor exactly as it is stored on the web server. Unlike more complex structures, a static site has no need for real-time processing or data lookups.

🧱 Static website
The concept of a static website is defined by its resources and how pages are rendered:

- Static Resources: These are files that remain unchanged unless a developer manually edits and uploads a new version. The server simply delivers these pre-built files as-is.
    - Examples include: HTML files (the page structure), CSS stylesheets (the design), and JavaScript files (client-side interactivity).
- Client-Generated Page: While the core structure is static, modern static sites may use client-side JavaScript (run in the user's browser) to add interactivity, such as animations, form validation, or fetching small amounts of data via an Application Programming Interface (API). However, the page itself is not built on the server.

🌐 Comparison to Dynamic website

The core difference between static and dynamic websites lies in when the page is created:

- Page Generation
Pre-built at development time. | Generated on the fly with every user request. |
- Server-Side Processing
Static site requires no server-side processing capabilities. Web server only hosts and delivers files. Dynamic Extensive processing needed to execute scripts and assemble the page.
- Database Use
No central database for content. All content is in the files. | Database-Centered (e.g., MySQL), used to store, retrieve, and update content in real-time.
- Content Delivery
Fixed content; every user sees the same thing. | Variable content; can be personalized based on the user (e.g., login status, location). |

In short, a static website completely bypasses the need for server-side processing and database queries for content creation, making it simpler, faster, and inherently more secure than dynamic websites, which rely heavily on these elements to create personalized, interactive, and constantly changing pages.

---

With recent state of web standard and improvement in end-user technology, our library try to be relying less fom the “dynamic” side of server-side processing and/or rendering, in favor of utilizing and optimizing client-side processing with static resources, while keeping the presentation and contents produced in flexible manner for multiple requirements on the fly.