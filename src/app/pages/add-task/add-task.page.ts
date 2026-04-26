import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonButton,
  IonInput, IonTextarea, IonSpinner, IonIcon,
  AlertController
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
    CommonModule, ReactiveFormsModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonButton,
    IonInput, IonTextarea, IonSpinner, IonIcon,
    AlertController
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

  // Čuvamo odakle je korisnik došao da bi se vratio na pravo mesto
  private returnUrl = '/tasks';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private taskService: TaskService,
    private categoryService: CategoryService,
    private alertCtrl: AlertController
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
    // Čitamo odakle je korisnik stigao (dashboard, calendar, tasks...)
    this.returnUrl = this.route.snapshot.queryParams['from'] || '/tasks';

    this.isViewMode = mode === 'view';
    this.isEditMode = !!this.taskId && !this.isViewMode;

    // 1. Prvo učitaj kategorije
    this.categoryService.getCategories().subscribe({
      next: (cats) => {
        this.categories = cats;
        if (this.taskId) {
          this.loadTask();
        } else if (cats.length > 0) {
          this.selectedCategory = cats[0];
        }
      },
      error: () => {
        this.errorMsg = 'Greška pri učitavanju kategorija. Proveri internet konekciju.';
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
        this.selectedPriority = task.priority;
        if (this.categories && this.categories.length > 0) {
          const foundCategory = this.categories.find(c => c.name === task.category);
          if (foundCategory) {
            this.selectedCategory = foundCategory;
          } else {
            this.selectedCategory = { id: '', name: task.category, color: task.categoryColor };
          }
        }
      },
      error: () => {
        this.errorMsg = 'Greška pri učitavanju zadatka. Proveri internet konekciju.';
      }
    });
  }

  selectPriority(p: string) {
    if (this.isViewMode) return;
    this.selectedPriority = p;
  }

  selectCategory(cat: Category) {
    if (this.isViewMode) return;
    this.selectedCategory = cat;
  }

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
      },
      error: () => {
        this.errorMsg = 'Greška pri čuvanju kategorije. Proveri internet konekciju.';
      }
    });
  }

  async deleteCategory(cat: Category, event: Event) {
    event.stopPropagation();

    // U edit modu, ne smeš obrisati kategoriju kojoj task trenutno pripada
    if (this.isEditMode && this.selectedCategory?.id === cat.id) {
      const alert = await this.alertCtrl.create({
        header: 'Nije moguće',
        message: 'Ne možeš obrisati kategoriju kojoj ovaj zadatak trenutno pripada. Prvo izmeni kategoriju zadatka.',
        buttons: ['OK'],
        cssClass: 'custom-alert'
      });
      await alert.present();
      return;
    }

    // Potvrda pre brisanja
    const alert = await this.alertCtrl.create({
      header: 'Obriši kategoriju',
      message: `Jesi li siguran/na da želiš da obrišeš kategoriju "${cat.name}"?`,
      buttons: [
        { text: 'Otkaži', role: 'cancel' },
        {
          text: 'Obriši',
          role: 'destructive',
          handler: () => {
            this.categoryService.deleteCategory(cat.id).subscribe({
              next: () => {
                this.categories = this.categories.filter(c => c.id !== cat.id);
                if (this.selectedCategory?.id === cat.id) {
                  this.selectedCategory = this.categories[0] ?? null;
                }
              },
              error: () => {
                this.errorMsg = 'Greška pri brisanju kategorije. Proveri internet konekciju.';
              }
            });
          }
        }
      ],
      cssClass: 'custom-alert'
    });
    await alert.present();
  }

  onSave() {
    if (this.taskForm.invalid) return;

    // Mora biti selektovana kategorija
    if (!this.selectedCategory) {
      this.errorMsg = 'Molimo izaberite kategoriju.';
      return;
    }

    this.isLoading = true;
    this.errorMsg = '';

    const { name, description, dueDate, dueTime } = this.taskForm.value;
    const task = {
      name,
      description: description || '',
      dueDate,
      dueTime,
      priority: this.selectedPriority,
      category: this.selectedCategory.name,
      categoryColor: this.selectedCategory.color,
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
          this.errorMsg = 'Greška pri izmeni. Proveri internet konekciju i pokušaj ponovo.';
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
          this.errorMsg = 'Greška pri čuvanju. Proveri internet konekciju i pokušaj ponovo.';
        }
      });
    }
  }

  goBack() {
    this.isEditMode = false;
    this.isViewMode = false;
    // Vraćamo se tamo odakle smo došli, ne uvek na /tasks
    this.router.navigate([this.returnUrl]);
  }
}