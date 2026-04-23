import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators,FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonButton,
  IonInput, IonTextarea, IonSpinner, IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBack } from 'ionicons/icons';
import { TaskService } from '../../services/task/task';
import { CategoryService } from '../../services/category/category';
import { Category } from '../../models/category.model';

@Component({
  selector: 'app-add-task',
  templateUrl: './add-task.page.html',
  styleUrls: ['./add-task.page.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,FormsModule,
    IonContent, IonHeader, IonToolbar, IonButton,
    IonInput, IonTextarea, IonSpinner, IonIcon
  ]
})
export class AddTaskPage implements OnInit {

  taskForm: FormGroup;
  isLoading = false;
  errorMsg = '';
  isEditMode = false;
  taskId = '';

  categories: Category[] = [];
  selectedCategory: Category | null = null;
  selectedPriority: string = 'Srednji';

  showNewCategory = false;
  newCategoryName = '';
  newCategoryColor = '#ff8fa3';

  colorOptions = [
    '#ff8fa3', '#5b9fff', '#39ff85',
    '#ffb830', '#b06fff', '#ff6060'
  ];

  priorities = ['Visok', 'Srednji', 'Nizak'];
  isViewMode = false;
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private taskService: TaskService,
    private categoryService: CategoryService
  ) {
    addIcons({ arrowBack });
    this.taskForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      dueDate: ['', Validators.required],
      dueTime: [''],
    });
  }


ngOnInit() {
  this.taskId = this.route.snapshot.params['id'];
  const mode = this.route.snapshot.queryParams['mode'];
  this.isViewMode = mode === 'view';
  this.isEditMode = !!this.taskId && !this.isViewMode;
  this.loadCategories();
  if (this.taskId) this.loadTask();
}
  
  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (cats) => {
        this.categories = cats;
        if (cats.length > 0 && !this.selectedCategory) {
          this.selectedCategory = cats[0];
        }
      }
    });
  }

  loadTask() {
    this.taskService.getTaskById(this.taskId).subscribe({
      next: (task) => {
        if (!task) return;
        this.taskForm.patchValue({
          name: task.name,
          description: task.description || '',
          dueDate: task.dueDate,
          dueTime: task.dueTime
        });
        //njih posebno jer nisu deo task form grupe
        this.selectedPriority = task.priority;
        //pravi se objekat
        this.selectedCategory = {
          id: '',
          name: task.category,
          color: task.categoryColor
        };
      }
    });
  }

  selectPriority(p: string) { this.selectedPriority = p; }

  selectCategory(cat: Category) { this.selectedCategory = cat; }

  toggleNewCategory() {
    this.showNewCategory = !this.showNewCategory;
    this.newCategoryName = '';
  }

  selectColor(color: string) { this.newCategoryColor = color; }

  saveNewCategory() {
    if (!this.newCategoryName.trim()) return;
    const newCat = { name: this.newCategoryName.trim(), color: this.newCategoryColor };
    this.categoryService.addCategory(newCat).subscribe({
      next: (res) => {
        const saved: Category = { id: res.name, ...newCat };
        this.categories.push(saved);
        this.selectedCategory = saved;
        this.showNewCategory = false;
        this.newCategoryName = '';
      }
    });
  }

  deleteCategory(cat: Category, event: Event) {
    event.stopPropagation();
    this.categoryService.deleteCategory(cat.id).subscribe({
      next: () => {
        this.categories = this.categories.filter(c => c.id !== cat.id);
        if (this.selectedCategory?.id === cat.id) {
          this.selectedCategory = this.categories[0] || null;
        }
      }
    });
  }

  onSave() {
    if (this.taskForm.invalid) return;
    this.isLoading = true;
    this.errorMsg = '';

    const { name, description, dueDate, dueTime } = this.taskForm.value;
    const task = {
      name,
      description: description || '',
      dueDate,
      dueTime,
      priority: this.selectedPriority,
      category: this.selectedCategory?.name || 'General',
      categoryColor: this.selectedCategory?.color || '#ff8fa3',
      completed: false
    };

    if (this.isEditMode) {
      this.taskService.updateTask(this.taskId, task).subscribe({
        next: () => {
          this.isLoading = false;
          this.goBack();
        },
        error: () => {
          this.isLoading = false;
          this.errorMsg = 'Greška pri izmeni. Pokušaj ponovo.';
        }
      });
    } else {
      this.taskService.addTask(task).subscribe({
        next: () => {
          this.isLoading = false;
          this.goBack();
        },
        error: () => {
          this.isLoading = false;
          this.errorMsg = 'Greška pri čuvanju. Pokušaj ponovo.';
        }
      });
    }
  }

  goBack() { this.router.navigate(['/tasks']); }
}