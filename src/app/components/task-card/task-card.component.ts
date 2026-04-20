import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../models/task.model';


@Component({
  selector: 'app-task-card',
  templateUrl: './task-card.component.html',
  styleUrls: ['./task-card.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class TaskCardComponent {
 
  //! : To je "non-null assertion". Kažeš TypeScript-u: "Veruj mi, Task će sigurno stići, nemoj da se buniš što nije definisan odmah na početku.
  //Pošto Angular koristi strogu proveru inicijalizacije, TypeScript bi prijavio grešku jer promenljiva task nema vrednost u trenutku kreiranja klase
  @Input() task!: Task;
  @Output() onToggle = new EventEmitter<Task>();
  @Output() onDelete = new EventEmitter<Task>();
  @Output() onEdit = new EventEmitter<Task>();
  @Output() onView = new EventEmitter<Task>();

view() {
  this.onView.emit(this.task);
}
edit() {
  this.onEdit.emit(this.task);
}
  toggle() {
   // .emit() uzima vrednost i šalje je kroz EventEmitter koji si definisala sa @Output, pa taj događaj može da uhvati parent komponenta.
    this.onToggle.emit(this.task);
  }

  delete() {
    this.onDelete.emit(this.task);
  }
}
