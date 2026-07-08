import { DjangoBlueprint, CommandItem } from "./types";

export const PRESET_BLUEPRINTS: Record<string, DjangoBlueprint> = {
  blog: {
    projectName: "blog_project",
    description: "A traditional Django blog application featuring categories, tags, posts, comments, and author profiles using an SQLite database.",
    files: [
      {
        filename: "models.py",
        path: "blog/models.py",
        content: `from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name

class Post(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('published', 'Published'),
    )
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique_for_date='publish')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blog_posts')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='posts')
    body = models.TextField()
    publish = models.DateTimeField(default=timezone.now)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')

    class Meta:
        ordering = ('-publish',)

    def __str__(self):
        return self.title

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    name = models.CharField(max_length=80)
    email = models.EmailField()
    body = models.TextField()
    created = models.DateTimeField(auto_now_add=True)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ('created',)

    def __str__(self):
        return f'Comment by {self.name} on {self.post}'
`
      },
      {
        filename: "views.py",
        path: "blog/views.py",
        content: `from django.shortcuts import render, get_object_or_404, redirect
from django.views.generic import ListView
from .models import Post, Comment
from .forms import CommentForm

class PostListView(ListView):
    queryset = Post.objects.filter(status='published')
    context_object_name = 'posts'
    paginate_by = 5
    template_name = 'blog/post/list.html'

def post_detail(request, year, month, day, post):
    post = get_object_or_404(Post, slug=post,
                                   status='published',
                                   publish__year=year,
                                   publish__month=month,
                                   publish__day=day)
    
    # List of active comments for this post
    comments = post.comments.filter(active=True)
    new_comment = None

    if request.method == 'POST':
        comment_form = CommentForm(data=request.POST)
        if comment_form.is_valid():
            # Create Comment object but don't save to database yet
            new_comment = comment_form.save(commit=False)
            # Assign the current post to the comment
            new_comment.post = post
            # Save the comment to the database
            new_comment.save()
            return redirect('blog:post_detail', year=year, month=month, day=day, post=post.slug)
    else:
        comment_form = CommentForm()

    return render(request,
                  'blog/post/detail.html',
                  {'post': post,
                   'comments': comments,
                   'new_comment': new_comment,
                   'comment_form': comment_form})
`
      },
      {
        filename: "urls.py",
        path: "blog/urls.py",
        content: `from django.urls import path
from . import views

app_name = 'blog'

urlpatterns = [
    # Post views
    path('', views.PostListView.as_view(), name='post_list'),
    path('<int:year>/<int:month>/<int:day>/<slug:post>/',
         views.post_detail,
         name='post_detail'),
]
`
      },
      {
        filename: "admin.py",
        path: "blog/admin.py",
        content: `from django.contrib import admin
from .models import Category, Post, Comment

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug', 'author', 'publish', 'status')
    list_filter = ('status', 'created', 'publish', 'author')
    search_fields = ('title', 'body')
    prepopulated_fields = {'slug': ('title',)}
    date_hierarchy = 'publish'
    ordering = ('status', 'publish')

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'post', 'created', 'active')
    list_filter = ('active', 'created', 'updated')
    search_fields = ('name', 'email', 'body')
`
      },
      {
        filename: "forms.py",
        path: "blog/forms.py",
        content: `from django import forms
from .models import Comment

class CommentForm(forms.ModelForm):
    class Meta:
        model = Comment
        fields = ('name', 'email', 'body')
        widgets = {
            'name': forms.TextInput(attrs={'class': 'w-full px-3 py-2 border rounded-md shadow-sm'}),
            'email': forms.EmailInput(attrs={'class': 'w-full px-3 py-2 border rounded-md shadow-sm'}),
            'body': forms.Textarea(attrs={'class': 'w-full px-3 py-2 border rounded-md shadow-sm', 'rows': 4}),
        }
`
      }
    ],
    explanations: `To launch your new Blog application in Python Django, execute these operations in your environment:

1. **Set up Virtual Environment**:
   \`\`\`bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate
   \`\`\`

2. **Install Django & Create Project**:
   \`\`\`bash
   pip install django
   django-admin startproject myproject .
   python manage.py startapp blog
   \`\`\`

3. **Register App**:
   Add \`'blog.apps.BlogConfig'\` to the \`INSTALLED_APPS\` list in \`myproject/settings.py\`.

4. **Prepare Database Migrations**:
   \`\`\`bash
   python manage.py makemigrations blog
   python manage.py migrate
   \`\`\`

5. **Generate an Administrator Account**:
   \`\`\`bash
   python manage.py createsuperuser
   \`\`\`

6. **Ignite the Server**:
   \`\`\`bash
   python manage.py runserver
   \`\`\`
   Visit http://127.0.0.1:8000/ to view your posts, or http://127.0.0.1:8000/admin/ to enter blog posts!`
  },
  ecommerce: {
    projectName: "store_project",
    description: "An inventory and order management subsystem for e-commerce, optimized for PostgreSQL database connections.",
    files: [
      {
        filename: "models.py",
        path: "store/models.py",
        content: `from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator

class Category(models.Model):
    name = models.CharField(max_length=150, db_index=True)
    slug = models.SlugField(max_length=150, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ('name',)
        verbose_name_plural = 'categories'

    def __str__(self):
        return self.name

class Product(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=200, db_index=True)
    slug = models.SlugField(max_length=200, db_index=True)
    image = models.ImageField(upload_to='products/%Y/%m/%d', blank=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)])
    stock = models.PositiveIntegerField(default=0)
    available = models.BooleanField(default=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('name',)
        index_together = (('id', 'slug'),)

    def __str__(self):
        return self.name

class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField()
    address = models.CharField(max_length=250)
    postal_code = models.CharField(max_length=20)
    city = models.CharField(max_length=100)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    paid = models.BooleanField(default=False)

    class Meta:
        ordering = ('-created',)

    def __str__(self):
        return f'Order {self.id}'

    def get_total_cost(self):
        return sum(item.get_cost() for item in self.items.all())

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='order_items')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f'{self.id}'

    def get_cost(self):
        return self.price * self.quantity
`
      },
      {
        filename: "views.py",
        path: "store/views.py",
        content: `from django.shortcuts import render, get_object_or_404, redirect
from .models import Category, Product, OrderItem
from .forms import OrderCreateForm

def product_list(request, category_slug=None):
    category = None
    categories = Category.objects.all()
    products = Product.objects.filter(available=True)
    if category_slug:
        category = get_object_or_404(Category, slug=category_slug)
        products = products.filter(category=category)
    return render(request,
                  'store/product/list.html',
                  {'category': category,
                   'categories': categories,
                   'products': products})

def product_detail(request, id, slug):
    product = get_object_or_404(Product, id=id, slug=slug, available=True)
    return render(request,
                  'store/product/detail.html',
                  {'product': product})

def order_create(request):
    # Dummy representation of a shopping cart
    cart_items = [
        # {'product': some_product, 'quantity': 2, 'price': 29.99}
    ]
    
    if request.method == 'POST':
        form = OrderCreateForm(request.POST)
        if form.is_valid():
            order = form.save()
            for item in cart_items:
                OrderItem.objects.create(order=order,
                                        product=item['product'],
                                        price=item['price'],
                                        quantity=item['quantity'])
            # Clear the cart logic here
            return render(request, 'store/order/created.html', {'order': order})
    else:
        form = OrderCreateForm()
    return render(request, 'store/order/create.html', {'form': form})
`
      },
      {
        filename: "urls.py",
        path: "store/urls.py",
        content: `from django.urls import path
from . import views

app_name = 'store'

urlpatterns = [
    path('', views.product_list, name='product_list'),
    path('<slug:category_slug>/', views.product_list, name='product_list_by_category'),
    path('<int:id>/<slug:slug>/', views.product_detail, name='product_detail'),
    path('order/create/', views.order_create, name='order_create'),
]
`
      },
      {
        filename: "admin.py",
        path: "store/admin.py",
        content: `from django.contrib import admin
from .models import Category, Product, Order, OrderItem

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'price', 'stock', 'available', 'created', 'updated')
    list_filter = ('available', 'created', 'updated', 'category')
    list_editable = ('price', 'stock', 'available')
    prepopulated_fields = {'slug': ('name',)}

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    raw_id_fields = ['product']

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'first_name', 'last_name', 'email', 'address', 'postal_code', 'city', 'paid', 'created', 'updated')
    list_filter = ('paid', 'created', 'updated')
    inlines = [OrderItemInline]
`
      }
    ],
    explanations: `To run your Django store with PostgreSQL:

1. **Install database driver**:
   \`\`\`bash
   pip install psycopg2-binary django
   \`\`\`

2. **Configure Database Settings** in \`settings.py\`:
   \`\`\`python
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.postgresql',
           'NAME': 'your_db_name',
           'USER': 'your_username',
           'PASSWORD': 'your_password',
           'HOST': 'localhost',
           'PORT': '5432',
       }
   }
   \`\`\`

3. **Migrate**:
   \`\`\`bash
   python manage.py makemigrations store
   python manage.py migrate
   \`\`\``
  },
  tasks: {
    projectName: "task_project",
    description: "An agile-friendly multi-user Task Management app utilizing category folders, assignees, and prioritized status columns.",
    files: [
      {
        filename: "models.py",
        path: "todo/models.py",
        content: `from django.db import models
from django.contrib.auth.models import User

class Folder(models.Model):
    name = models.CharField(max_length=50)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='folders')
    color = models.CharField(max_length=7, default="#4f46e5") # Hex code

    def __str__(self):
        return self.name

class Task(models.Model):
    PRIORITY_CHOICES = (
        ('L', 'Low'),
        ('M', 'Medium'),
        ('H', 'High'),
    )
    STATUS_CHOICES = (
        ('todo', 'To Do'),
        ('in_progress', 'In Progress'),
        ('done', 'Completed'),
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    folder = models.ForeignKey(Folder, on_delete=models.CASCADE, related_name='tasks')
    assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    priority = models.CharField(max_length=1, choices=PRIORITY_CHOICES, default='M')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='todo')
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.title
`
      },
      {
        filename: "views.py",
        path: "todo/views.py",
        content: `from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from .models import Folder, Task

@login_required
def dashboard(request):
    folders = request.user.folders.all()
    tasks = Task.objects.filter(folder__owner=request.user)
    
    # Simple status filtering
    status_filter = request.GET.get('status')
    if status_filter:
        tasks = tasks.filter(status=status_filter)
        
    return render(request, 'todo/dashboard.html', {
        'folders': folders,
        'tasks': tasks,
    })

@login_required
def toggle_task(request, task_id):
    task = get_object_or_404(Task, id=task_id, folder__owner=request.user)
    if task.status == 'done':
        task.status = 'todo'
    else:
        task.status = 'done'
    task.save()
    return redirect('todo:dashboard')
`
      },
      {
        filename: "urls.py",
        path: "todo/urls.py",
        content: `from django.urls import path
from . import views

app_name = 'todo'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('task/<int:task_id>/toggle/', views.toggle_task, name='toggle_task'),
]
`
      }
    ],
    explanations: `Setting up your Django Kanban or Task tracker:

1. **Start task application**:
   \`\`\`bash
   python manage.py startapp todo
   \`\`\`

2. **Add auth middleware**:
   Since it uses \`@login_required\`, configure the login redirect url in your \`settings.py\`:
   \`\`\`python
   LOGIN_URL = 'login'
   LOGIN_REDIRECT_URL = 'todo:dashboard'
   \`\`\`

3. **Migrate & Test**:
   \`\`\`bash
   python manage.py makemigrations todo
   python manage.py migrate
   \`\`\``
  }
};

export const CHEATSHEETS: CommandItem[] = [
  {
    command: "python -m venv venv",
    description: "Create Virtual Environment",
    category: "Setup",
    explanation: "Creates an isolated sandbox environment so python dependencies do not clash globally. Activates with 'source venv/bin/activate' or Windows equivalent 'venv\\Scripts\\activate'."
  },
  {
    command: "pip install django",
    description: "Install Django Library",
    category: "Setup",
    explanation: "Downloads and installs Django web framework inside the active virtual environment."
  },
  {
    command: "django-admin startproject config .",
    description: "Start New Django Project",
    category: "Setup",
    explanation: "Initializes a Django project named 'config' in the current root folder. Creates crucial configuration files like settings.py, urls.py, and manage.py."
  },
  {
    command: "python manage.py startapp myapp",
    description: "Create Django App Module",
    category: "Setup",
    explanation: "Scaffolds a reusable, isolated Django app module named 'myapp' containing models.py, views.py, tests.py, apps.py, and admin.py."
  },
  {
    command: "python manage.py makemigrations",
    description: "Prepare Database Schema Changes",
    category: "Migrations",
    explanation: "Scans models.py for modifications (new tables, updated fields) and generates auto-coded Python instructions (migration files) in the migrations/ folder."
  },
  {
    command: "python manage.py migrate",
    description: "Apply Migrations to Database",
    category: "Migrations",
    explanation: "Executes the pending migration scripts, converting Python models into database tables (e.g., CREATE TABLE in SQL)."
  },
  {
    command: "python manage.py showmigrations",
    description: "List Migration Progress",
    category: "Migrations",
    explanation: "Shows all apps, their generated migration sheets, and whether they have been applied ([X]) or are pending ([ ])."
  },
  {
    command: "python manage.py runserver",
    description: "Start Dev Web Server",
    category: "Server",
    explanation: "Launches the lightweight built-in development HTTP server on localhost port 8000. Auto-reloads code on save."
  },
  {
    command: "python manage.py createsuperuser",
    description: "Create Administrator Profile",
    category: "Auth & Security",
    explanation: "Prompts for a username, email, and password to create a superuser with full access to Django's administrative backoffice (/admin)."
  },
  {
    command: "python manage.py dbshell",
    description: "Access Database Console",
    category: "Database",
    explanation: "Opens a raw SQL shell terminal connected directly to your configured project database (SQLite, Postgres, etc.) for executing SQL statements."
  },
  {
    command: "python manage.py shell",
    description: "Django Interactive Python shell",
    category: "Database",
    explanation: "Launches a custom interactive Python console with Django fully loaded. Let's you run queries like 'Post.objects.all()' or update database records directly."
  }
];
