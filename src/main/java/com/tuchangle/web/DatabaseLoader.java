package com.tuchangle.web;

import java.util.Date;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DatabaseLoader implements CommandLineRunner {

  @Autowired
  private DietaryRepository repository;

  @Override
  public void run(String... strings) throws Exception {
    Dietary dietary = new Dietary();
    dietary.setFood("苹果");
    dietary.setGram(100);
    dietary.setInsertTime(new Date());
    this.repository.save(dietary);
    
    Dietary dietary2 = new Dietary();
    dietary2.setFood("香蕉");
    dietary2.setGram(200);
    dietary2.setInsertTime(new Date());
    this.repository.save(dietary2);
  }

}
