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
    this.onToggle.emit(this.task);
  }

  delete() {
    this.onDelete.emit(this.task);
  }
}
