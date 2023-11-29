import { Component, OnInit } from '@angular/core';
import { Alquiler } from 'src/app/modelos/alquiler';
import { MatDialog } from '@angular/material/dialog';
import { Inventario } from 'src/app/modelos/inventario';
import { Tercero } from 'src/app/modelos/tercero';
import { AlquilerService } from 'src/app/servicios/alquiler.service';
import { InventarioService } from 'src/app/servicios/inventario.service';
import { Router } from '@angular/router';
import { Globales } from 'src/app/modelos/globales';
import { TerceroService } from 'src/app/servicios/tercero.service';
import { DecidirComponent } from '../decidir/decidir.component';
import { HttpErrorResponse } from '@angular/common/http';
import { AlquilerEditarComponent } from '../alquiler-editar/alquiler-editar.component';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';

@Component({
  selector: 'app-alquiler',
  templateUrl: './alquiler.component.html',
  styleUrls: ['./alquiler.component.css']
})
export class AlquilerComponent implements OnInit {

  public alquileres: Alquiler[] = [];
  public inventarios: Inventario[] = [];
  public terceros: Tercero[] = [];
  public columnas = [
    { name: 'Codigo', prop: 'id' },
    { name: '#Inventario', prop: 'inventario.id' },
    { name: '#Cliente', prop: 'tercero.nombre' },
    { name: 'Fecha prestamo', prop: 'fechaPrestamo' },
    { name: 'Plazo', prop: 'plazo' },
    { name: 'Fecha devolucion', prop: 'fechaDevolucion' },
    { name: 'Precio', prop: 'precio' },
  ];

  public textoBusqueda: number = 0;
  public alquilerSeleccion: Alquiler | undefined;
  public tipoSeleccion = SelectionType;
  public modoColumna = ColumnMode;
  tema: String = "dark";
  

  constructor(public dialog: MatDialog,
    private alquilerService: AlquilerService,
    private inventarioService: InventarioService,
    private terceroService: TerceroService,
    private router: Router
  ){ }

  ngOnInit(): void {
    if (Globales.usuario) {
      this.listar();
      this.listarClientes();
      this.listarInventarios();
    }
    else {
      this.router.navigate(["inicio"]);
    }
  }

  public onActivate(event: any) {
    if (event.type == 'click') {
      this.alquilerSeleccion = event.row;
    }
  }

  public listar() {
    this.alquilerService.listar()
      .subscribe(data => {
        this.alquileres = data;
      },
        err => {
          window.alert(err.message)
        });
  }

  //Lista inventarios cuando se crea una nuevo alquiler
  public listarInventarios() {
    this.inventarioService.listar()
      .subscribe(data => {
        this.inventarios = data;
      },
        err => {
          window.alert(err.message)
        });
  }

  //Lista clientes cuando se crea una nuevo alquiler
  public listarClientes() {
    this.terceroService.listar()
      .subscribe(data => {
        this.terceros = data;
      },
        err => {
          window.alert(err.message)
        });
  }

  public buscar() {
    if (this.textoBusqueda > 0) {
      this.alquilerService.buscar(this.textoBusqueda)
        .subscribe(data => {
          this.alquileres = data;
        },
          err => {
            window.alert(err.message)
          });
    }
    else {
      this.listar();
    }
  }

  public agregar() {
    const dialogRef = this.dialog.open(AlquilerEditarComponent, {
      width: '600px',
      height: '500px',
      data: {
        encabezado: "Agregando Alquiler:",
        alquiler: new Alquiler(
          0, //Id
          new Inventario(0, 0, 0, 0, new Date(), ""), //Inventario
          new Tercero(0, 0, "", "", "", 0, "", ""),
          new Date(),
          0,
          new Date(),
          0
        ),
        inventarios: this.inventarios,
        terceros: this.terceros,
      }
    });

    dialogRef.afterClosed().subscribe((datos) => {
      if (datos) {
        this.guardar(datos.alquiler);
      }
    }, err => {
      window.alert(err.message)
    }
    );
  }

  public modificar() {
    if (this.alquilerSeleccion != null && this.alquilerSeleccion.id >= 0) {
      const dialogRef = this.dialog.open(AlquilerEditarComponent, {
        width: '600px',
        height: '500px',
        data: {
          encabezado: `Editando a datos del alquiler [${this.alquilerSeleccion.id}]`,
          alquiler: this.alquilerSeleccion,
          inventarios: this.inventarios,
          terceros: this.terceros,
          fechaPrestamo: this.columnas,
        }
      });

      dialogRef.afterClosed().subscribe((datos) => {
        if (datos) {
          this.guardar(datos.alquiler);
        }
      }, err => {
        window.alert(err.message)
      }
      );

    }
    else {
      window.alert("Debe seleccionar un Alquiler");
    }
  }

  private guardar(alquiler: Alquiler) {
    if (alquiler.id == 0) {
      this.alquilerService.agregar(alquiler).subscribe(alquilerActualizado => {
        this.listar();
        window.alert("Los datos del alquiler fueron agregados");
      },
        (err: HttpErrorResponse) => {
          window.alert(`Error agregando el alquiler: [${err.message}]`);
        });
    }
    else {
      this.alquilerService.actualizar(alquiler).subscribe(alquilerActualizado => {
        this.listar();
        window.alert("Los datos del alquiler fueron actualizados");
      },
        (err: HttpErrorResponse) => {
          window.alert(`Error actualizando alquiler: [${err.message}]`);
        });
    }
  }

  public verificarEliminar() {
    if (this.alquilerSeleccion != null && this.alquilerSeleccion.id >= 0) {
      const dialogRef = this.dialog.open(DecidirComponent, {
        width: '400px',
        height: '200px',
        data: {
          titulo: `Eliminar registro del Alquiler [${this.alquilerSeleccion.id}]`,
          mensaje: "Está seguro?",
          id: this.alquilerSeleccion.id,
        }
      });

      dialogRef.afterClosed().subscribe(datos => {
        if (datos) {
          this.eliminar(datos.id);
        }
      },
        err => {
          window.alert(err.message)
        });

    }
    else {
      window.alert("Debe seleccionar un Alquiler");
    }
  }

  private eliminar(id: number) {
    this.alquilerService.eliminar(id).subscribe(response => {
      if (response == true) {
        this.listar();
        window.alert("El registro del Alquiler fue eliminado");
      }
      else {
        window.alert("No se pudo eliminar el registro del Alquiler");
      }
    },
      error => {
        window.alert(error.message)
      }
    );
  }
}
