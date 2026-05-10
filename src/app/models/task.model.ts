export interface Task {
  id: string;
  name: string;
  //bolje ovako nego categorz objekat jer Firebase cuva objekte kao json pa bi se ugnjezdavao objekat i komplikovalo
  category: string;
  categoryColor: string;
  priority: string;
  dueDate: string;
  dueTime: string;
  completed: boolean;
}